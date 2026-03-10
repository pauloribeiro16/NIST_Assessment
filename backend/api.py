from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import os
import json
import subprocess
import requests
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

from MultiLLM import get_valid_models, MODEL_SCORES, run_phase_a_step, run_debate_round_step, run_final_consensus, CouncilLogger
from src.config import DOMAINS, OLLAMA_BASE_URL, LOGS_DIR, SYSTEM_PROMPT
from src.rag_engine import RAGEngine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serving static files for the frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Models for Request Validation
class SetupRequest(BaseModel):
    selected_models: List[str]
    question: str

class PhaseAStepRequest(BaseModel):
    model_name: str
    question: str
    log_file_path: str

class DebateStepRequest(BaseModel):
    model_name: str
    selected_models: List[str]
    question: str
    previous_results: Dict[str, str]
    round_num: int
    log_file_path: str

class ConsensusRequest(BaseModel):
    selected_models: List[str]
    question: str
    final_round_results: Dict[str, str]
    log_file_path: str

# RAG Models
class RagQueryRequest(BaseModel):
    model_name: str
    domain_key: str
    question: str

class AssessmentRequest(BaseModel):
    model_name: str
    domains: List[str]
    case_text: str

def format_source_nodes(source_nodes):
    if not source_nodes:
        return "No source nodes found."
    
    formatted_output = []
    for i, node_with_score in enumerate(source_nodes):
        node = node_with_score.node
        score = node_with_score.score
        meta = node.metadata
        
        # Construct identifier from available metadata
        identifier_parts = []
        if 'cwe_id' in meta: identifier_parts.append(f"{meta['cwe_id']}")
        if 'capec_id' in meta: identifier_parts.append(f"{meta['capec_id']}")
        if 'type' in meta: identifier_parts.append(str(meta['type']))
        if 'article_number' in meta: identifier_parts.append(f"Art. {meta['article_number']}")
        if 'paragraph' in meta: identifier_parts.append(f"Para. {meta['paragraph']}")
        if 'recital_number' in meta: identifier_parts.append(f"Recital {meta['recital_number']}")
        
        identifier = ", ".join(identifier_parts) if identifier_parts else "Metadata: " + str(meta)
        formatted_output.append(f"--- SOURCE NODE {i+1} (Score: {score:.4f}) | {identifier} ---\n{node.get_content()}")
        
    return "\n\n".join(formatted_output)

# Endpoints
@app.get("/api/ollama/status")
def get_ollama_status():
    """Check if Ollama is running by calling its API directly."""
    try:
        resp = requests.get("http://127.0.0.1:11434/api/tags", timeout=2)
        if resp.status_code == 200:
            return {"status": "running"}
        return {"status": "stopped"}
    except requests.exceptions.RequestException:
        return {"status": "stopped"}

@app.post("/api/ollama/start")
def start_ollama():
    """Start Ollama process."""
    try:
        subprocess.Popen(["env", "OLLAMA_MODELS=/500G/ollama_models", "OLLAMA_HOST=127.0.0.1:11434", "ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return {"status": "starting"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ollama/stop")
def stop_ollama():
    """Kill Ollama process safely."""
    try:
        subprocess.run(["pkill", "ollama"], check=False)
        return {"status": "stopping"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models")
def get_models():
    """Retrieve available models and their scores."""
    valid_models = get_valid_models()
    valid_models.sort(key=lambda m: MODEL_SCORES.get(m, 0), reverse=True)
    models_info = [{"name": m, "score": MODEL_SCORES.get(m, 0)} for m in valid_models]
    return {"models": models_info}

@app.post("/api/init_logger")
def init_logger(req: SetupRequest):
    """Initialize the logger and return the file path."""
    logger = CouncilLogger()
    logger.initialize(req.selected_models, req.question)
    return {"log_file_path": logger.filepath}

@app.post("/api/phase_a_step")
def execute_phase_a_step(req: PhaseAStepRequest):
    """Execute Phase A of the debate for a single model."""
    logger = CouncilLogger()
    logger.filepath = req.log_file_path # Re-attach the existing log file
    
    resp = run_phase_a_step(req.model_name, req.question, logger)
    return {
        "model": req.model_name,
        "response": resp
    }

@app.post("/api/debate_round_step")
def execute_debate_round_step(req: DebateStepRequest):
    """Execute a single round of debate for a single model."""
    logger = CouncilLogger()
    logger.filepath = req.log_file_path # Re-attach the existing log file
    
    resp = run_debate_round_step(req.model_name, req.selected_models, req.question, req.previous_results, logger, req.round_num)
    
    return {
        "model": req.model_name,
        "response": resp
    }

@app.post("/api/consensus")
def execute_consensus(req: ConsensusRequest):
    """Generate final consensus."""
    logger = CouncilLogger()
    logger.filepath = req.log_file_path # Re-attach the existing log file
    
    leader_model, summary = run_final_consensus(req.selected_models, req.question, req.final_round_results, logger)
    
    return {
        "leader": leader_model,
        "summary": summary
    }

# --- RAG ENDPOINTS ---
@app.get("/api/rag/domains")
def get_rag_domains():
    """Retrieve available regulatory domains."""
    return {"domains": list(DOMAINS.keys())}

@app.post("/api/rag/query")
def execute_rag_query(req: RagQueryRequest):
    """Execute a single RAG chat query."""
    if req.domain_key not in DOMAINS:
        raise HTTPException(status_code=400, detail="Invalid domain selected.")
        
    selected_config = DOMAINS[req.domain_key]
    
    try:
        engine = RAGEngine(llm_model_name=req.model_name)
        index = engine.get_index(selected_config)
        query_engine = engine.get_chat_engine(index)
        
        response = query_engine.chat(req.question)
        
        # Capture traces
        initial_retrieval = format_source_nodes(engine.trace_initial) if hasattr(engine, 'trace_initial') else ""
        reranked_retrieval = format_source_nodes(engine.trace_reranked) if hasattr(engine, 'trace_reranked') else ""
        
        # Reconstruct the Final Prompt (roughly)
        # The context chat engine combines system prompt + context nodes + user question
        context_str = "\n\n".join([n.node.get_content() for n in engine.trace_reranked]) if hasattr(engine, 'trace_reranked') else ""
        final_prompt = f"--- SYSTEM PROMPT ---\n{SYSTEM_PROMPT}\n\n--- CONTEXT ---\n{context_str}\n\n--- USER QUESTION ---\n{req.question}"
        
        citations = ""
        if hasattr(response, 'source_nodes') and response.source_nodes:
            # We use the final source nodes for citations
            citations = format_source_nodes(response.source_nodes)
            
        return {
            "model": req.model_name,
            "response": str(response),
            "citations": citations,
            "trace": {
                "initial": initial_retrieval,
                "reranked": reranked_retrieval,
                "final_prompt": final_prompt
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assess_case")
def assess_case(req: AssessmentRequest):
    """
    Executes the multi-step applicability assessment across multiple domains.
    """
    try:
        results = []
        for domain_name in req.domains:
            # Find domain config
            if domain_name not in DOMAINS:
                results.append({"domain": domain_name, "error": f"Domain {domain_name} not found in configuration."})
                continue
            
            domain_config = DOMAINS[domain_name].copy()
            domain_config['name'] = domain_name
            
            # Ensure logs directory exists
            if not os.path.exists(LOGS_DIR):
                os.makedirs(LOGS_DIR)
            
            # Use RAGEngine
            engine = RAGEngine(log_file=os.path.join(LOGS_DIR, f"assessment_{domain_name}.log"))
            assessment_result = engine.assess_applicability_multistep(domain_config, req.model_name, req.case_text)
            results.append(assessment_result)
            
        return {"model": req.model_name, "assessments": results}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- NIST MCP ENDPOINTS ---
import json as _json
from src.nist_mcp_client import mcp_client

class NistChatRequest(BaseModel):
    model_name: str
    message: str
    history: List[Dict] = []

@app.get("/api/nist/tools")
async def get_nist_tools():
    """List available NIST MCP tools (for internal use/debugging)."""
    try:
        tools = await mcp_client.get_tools()
        tools_list = [{"name": t.name, "description": t.description, "inputSchema": t.inputSchema} for t in tools]
        return {"tools": tools_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_relevant_tools_context(user_message: str, tools: list) -> str:
    """Filter which tool schemas to fully inject to save LLM context window."""
    query = user_message.lower()
    
    # Define keywords for domains
    domain_keywords = {
        "assessment": ["assess", "question", "workflow", "progress", "score", "start", "resume"],
        "organization": ["org", "profile", "company", "create", "clone", "compare"],
        "analysis": ["gap", "implement", "plan", "benchmark", "matrix", "priority", "cost", "risk"],
        "reporting": ["report", "dashboard", "executive", "compliance", "audit"],
        "search": ["search", "lookup", "subcategories", "guidance", "explore"]
    }
    
    # Determine active domains
    active_domains = set(["search"]) # Always include basic search
    for domain, kws in domain_keywords.items():
        if any(kw in query for kw in kws):
            active_domains.add(domain)

    # Map domains to tool name prefixes/keywords
    domain_tool_maps = {
        "assessment": ["assessment", "assess_", "workflow", "score", "progress", "question", "persistent"],
        "organization": ["org", "profile"],
        "analysis": ["gap", "implement", "benchmark", "priority", "cost", "risk", "trend"],
        "reporting": ["report", "dashboard", "milestone"],
        "search": ["lookup", "search", "related", "guidance", "get_"]
    }
    
    context_lines = []
    
    for t in tools:
        t_name = t.name.lower()
        is_relevant = False
        for domain in active_domains:
            if any(kw in t_name for kw in domain_tool_maps[domain]):
                is_relevant = True
                break
        
        if is_relevant:
            # Inject full schema for relevant tools
            schema_str = _json.dumps(t.inputSchema) if hasattr(t, "inputSchema") else "{}"
            context_lines.append(f"- {t.name}: {t.description}\n  Schema: {schema_str}")
        else:
            # Just name and description for others
            context_lines.append(f"- {t.name}: {t.description}")
            
    return "\n".join(context_lines)

@app.post("/api/nist/chat")
async def nist_chat(req: NistChatRequest):
    """
    Chat with an Ollama model that has access to NIST CSF 2.0 MCP tools.
    Falls back to knowledge-only mode if the MCP server (Docker) is not available.
    """
    try:
        # 1. Fetch MCP tools - gracefully handle if MCP Docker container is offline
        tools_summary = ""
        mcp_available = True
        try:
            tools = await mcp_client.get_tools()
            tools_summary = get_relevant_tools_context(req.message, tools)
        except Exception as mcp_err:
            mcp_available = False
            import traceback
            print(f"[WARN] MCP server unavailable, falling back to knowledge-only mode. Error: {repr(mcp_err)}")
            traceback.print_exc()

        if mcp_available and tools_summary:
            system_prompt = (
                "You are an expert NIST CSF 2.0 cybersecurity assessor assistant. "
                "You have access to a NIST CSF MCP server with the following tools:\n\n"
                f"{tools_summary}\n\n"
                "When the user asks a question about NIST CSF 2.0 assessments, gap analysis, "
                "maturity scoring, or implementation planning, you should:\n"
                "1. Decide which MCP tool(s) to call using the JSON schemas provided.\n"
                "   To generate an assessment, use `start_assessment_workflow` or `create_profile` first.\n"
                "   IMPORTANT: Only use tool names exactly as listed, matching the schema exactly.\n"
                "2. To invoke a tool, respond with JSON on a single line in the format: "
                '{"call_tool": "<tool_name>", "args": {<arguments>}}\n'
                "3. Once you have the tool result, provide a comprehensive formatted Markdown response.\n"
                "   IMPORTANT: For charts, use fenced JSON blocks with language `json_chart` in these formats:\n\n"
                "   A) Overall Executive Radar (across 6 Functions):\n"
                "   ```json_chart\n"
                '   {"type": "radar", "data": {"labels": ["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"], "datasets": [{"label": "Maturity", "data": [2, 3, 1, 4, 2, 2]}]}}\n'
                "   ```\n"
                "   B) Category-level bar chart for a Function (e.g., within Identify):\n"
                "   ```json_chart\n"
                '   {"type": "bar", "domain": "Identify", "data": {"labels": ["Asset Management", "Risk Assessment", "Improvement"], "datasets": [{"label": "Maturity", "data": [3, 2, 4]}]}}\n'
                "   ```\n"
                "   C) Sub-category (Control) level bar chart for a specific Category (e.g., Asset Management within Identify):\n"
                "   ```json_chart\n"
                '   {"type": "bar", "domain": "Identify", "category": "Asset Management", "data": {"labels": ["ID.AM-01", "ID.AM-02", "ID.AM-03"], "datasets": [{"label": "Maturity", "data": [4, 3, 2]}]}}\n'
                "   ```\n"
                "   Always output maturity scores between 0 and 4. Use these JSON structures to update the dashboard automatically."
            )
        else:
            system_prompt = (
                "You are an expert NIST CSF 2.0 cybersecurity assessor assistant. "
                "Note: The NIST MCP tool server is currently unavailable. Operating in knowledge-only mode.\n\n"
                "Provide accurate responses about NIST CSF 2.0 maturity scoring, gap analysis, and planning.\n\n"
                "IMPORTANT: For charts, use fenced JSON blocks with language `json_chart` in these formats:\n\n"
                "A) Overall Radar:\n"
                "```json_chart\n"
                '{"type": "radar", "data": {"labels": ["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"], "datasets": [{"label": "Maturity", "data": [2, 3, 1, 4, 2, 2]}]}}\n'
                "```\n"
                "B) Category-level bar chart (e.g., Detect):\n"
                "```json_chart\n"
                '{"type": "bar", "domain": "Detect", "data": {"labels": ["Monitoring", "Analysis"], "datasets": [{"label": "Maturity", "data": [3, 1]}]}}\n'
                "```\n"
                "C) Sub-category (Control) level bar chart (e.g., Monitoring within Detect):\n"
                "```json_chart\n"
                '{"type": "bar", "domain": "Detect", "category": "Continuous Monitoring", "data": {"labels": ["DE.CM-01", "DE.CM-02", "DE.CM-03"], "datasets": [{"label": "Maturity", "data": [4, 2, 3]}]}}\n'
                "```\n"
                "Always output maturity scores between 0 and 4. Use these JSON structures to update the dashboard automatically."
            )

        # 2. Build the Ollama payload
        ollama_messages = [
            {"role": "system", "content": system_prompt}
        ]
        # Add conversation history
        for h in req.history:
            ollama_messages.append(h)
        ollama_messages.append({"role": "user", "content": req.message})

        ollama_url = f"{OLLAMA_BASE_URL}/api/chat"
        resp = requests.post(
            ollama_url,
            json={"model": req.model_name, "messages": ollama_messages, "stream": False},
            timeout=120
        )
        resp.raise_for_status()
        llm_reply = resp.json()["message"]["content"].strip()

        # 3. Check if the LLM wants to call a tool
        tool_result_text = None
        tool_used = False
        tool_error_text = None
        workflow_id = None

        for line in llm_reply.splitlines():
            stripped = line.strip()
            if stripped.startswith('{"call_tool"'):
                try:
                    tool_used = True
                    call_data = _json.loads(stripped)
                    tool_name = call_data.get("call_tool")
                    tool_args = call_data.get("args", {})
                    mcp_result = await mcp_client.call_tool(tool_name, tool_args)
                    
                    if mcp_result.isError:
                         tool_error_text = f"Tool '{tool_name}' returned an ERROR: {mcp_result.content}"
                    elif mcp_result.content:
                        tool_result_text = "\n".join(
                            c.text for c in mcp_result.content if hasattr(c, "text")
                        )
                        # Attempt to extract workflow_id if it's a JSON response
                        try:
                            for c in mcp_result.content:
                                if hasattr(c, "text"):
                                    parsed = _json.loads(c.text)
                                    if "workflow_id" in parsed:
                                        workflow_id = parsed["workflow_id"]
                        except Exception:
                            pass
                    break
                except Exception as e:
                    tool_error_text = f"Failed to execute tool call. Error: {str(e)}. Make sure you are using a tool name exactly from the provided list."
                    break

        final_response = llm_reply
        if tool_result_text or tool_error_text:
            # Feed the tool result (or error) back to the LLM for a final natural-language response
            follow_up_messages = ollama_messages + [
                {"role": "assistant", "content": llm_reply}
            ]
            
            if tool_error_text:
                 follow_up_messages.append({
                     "role": "user", 
                     "content": f"Your tool call failed:\n{tool_error_text}\n\nPlease correct your approach or answer based on what you already know without the tool."
                 })
            else:
                 follow_up_messages.append({
                     "role": "user", 
                     "content": f"Tool result:\n{tool_result_text}\n\nNow summarize this for me clearly."
                 })
                 
            follow_resp = requests.post(
                ollama_url,
                json={"model": req.model_name, "messages": follow_up_messages, "stream": False},
                timeout=120
            )
            follow_resp.raise_for_status()
            final_response = follow_resp.json()["message"]["content"].strip()

        return {
            "response": final_response,
            "tool_used": tool_used,
            "workflow_id": workflow_id
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=repr(e))

@app.on_event("shutdown")
async def shutdown_event():
    await mcp_client.cleanup()

# ── MULTI-PROJECT STATE PERSISTENCE ──────────────────────────────────────────────
import uuid
from datetime import datetime

DATA_DIR = Path(__file__).parent / "data"
PROJECTS_DIR = DATA_DIR / "projects"
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)

class ProjectCreateModel(BaseModel):
    name: str

class ProjectStateModel(BaseModel):
    functions: Dict[str, Any]
    overallMaturity: float = 0.0
    completionRate: float = 0.0

@app.get("/api/projects")
def get_projects():
    """List all projects."""
    projects = []
    for p_file in PROJECTS_DIR.glob("*.json"):
        try:
            with open(p_file, "r") as f:
                data = json.load(f)
                projects.append({
                    "id": p_file.stem,
                    "name": data.get("name", "Unknown Project"),
                    "lastModified": data.get("lastModified", ""),
                    "overallMaturity": data.get("state", {}).get("overallMaturity", 0.0),
                    "completionRate": data.get("state", {}).get("completionRate", 0.0)
                })
        except Exception:
            pass
    # Sort by descending lastModified (newest first)
    projects.sort(key=lambda x: x["lastModified"], reverse=True)
    return {"projects": projects}

@app.post("/api/projects")
def create_project(req: ProjectCreateModel):
    """Create a new project."""
    project_id = str(uuid.uuid4())
    project_file = PROJECTS_DIR / f"{project_id}.json"
    
    initial_data = {
        "id": project_id,
        "name": req.name,
        "createdAt": datetime.now().isoformat(),
        "lastModified": datetime.now().isoformat(),
        "state": {
            "functions": {},
            "overallMaturity": 0.0,
            "completionRate": 0.0
        }
    }
    
    with open(project_file, "w") as f:
        json.dump(initial_data, f, indent=2)
        
    return {"id": project_id, "name": req.name}

@app.get("/api/projects/{project_id}")
def get_project_state(project_id: str):
    """Return the persisted assessment scores for a project."""
    project_file = PROJECTS_DIR / f"{project_id}.json"
    if project_file.exists():
        try:
            with open(project_file, "r") as f:
                data = json.load(f)
                return data.get("state", {"functions": {}, "overallMaturity": 0.0, "completionRate": 0.0})
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read project: {e}")
    raise HTTPException(status_code=404, detail="Project not found")

@app.post("/api/projects/{project_id}")
def save_project_state(project_id: str, state: ProjectStateModel):
    """Persist the assessment scores to a project."""
    project_file = PROJECTS_DIR / f"{project_id}.json"
    if not project_file.exists():
        raise HTTPException(status_code=404, detail="Project not found")
        
    try:
        with open(project_file, "r") as f:
            data = json.load(f)
            
        data["state"] = state.dict()
        data["lastModified"] = datetime.now().isoformat()
        
        with open(project_file, "w") as f:
            json.dump(data, f, indent=2)
            
        return {"status": "saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save project: {e}")

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str):
    """Delete a project."""
    project_file = PROJECTS_DIR / f"{project_id}.json"
    if project_file.exists():
        project_file.unlink()
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Project not found")


if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=5001, reload=True)
