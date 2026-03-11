import os
import sys
import logging
import warnings
import traceback
import time
from src.utils import get_ollama_memory, get_gpu_vram, sanitize_prompt, sanitize_log
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    Settings
)
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.ollama import Ollama
from qdrant_client import QdrantClient
from llama_index.core.postprocessor import SentenceTransformerRerank
from src.config import OLLAMA_BASE_URL, EMBEDDING_MODEL, LLM_MODEL, RERANKER_MODEL, DATA_DIR, STORAGE_DIR, SYSTEM_PROMPT, OLLAMA_TIMEOUT


# Ignorar aviso do Qdrant local sobre índices de payload (não afeta o funcionamento)
warnings.filterwarnings("ignore", message="Payload indexes have no effect in the local Qdrant")

# Global QdrantClient for local storage to prevent concurrent access lock exceptions
GLOBAL_QDRANT_CLIENT = None

def get_qdrant_client():
    global GLOBAL_QDRANT_CLIENT
    if GLOBAL_QDRANT_CLIENT is None:
        GLOBAL_QDRANT_CLIENT = QdrantClient(path=STORAGE_DIR)
    return GLOBAL_QDRANT_CLIENT
# Configurar logs
logging.basicConfig(stream=sys.stdout, level=logging.INFO)
from src.utils import setup_logger
logger = setup_logger(__name__)

class RetrievalLogger:
    """Helper class to log retrieved nodes and store them for the UI trace."""
    def __init__(self, stage_name, log_file=None, trace_list=None):
        self.stage_name = stage_name
        self.log_file = log_file
        self.trace_list = trace_list

    def postprocess_nodes(self, nodes, query_bundle=None):
        log_lines = []
        log_lines.append(f"\n🔍 {self.stage_name} ({len(nodes)} nodes):")
        for i, node in enumerate(nodes):
            score = f"{node.score:.4f}" if node.score is not None else "None"
            # Clean up newlines for cleaner log
            content_preview = node.node.get_content().replace('\n', ' ')[:150]
            log_lines.append(f"  {i+1}. [{score}] {content_preview}...")
        log_lines.append("-" * 50)
        
        full_log = "\n".join(log_lines)
        print(full_log)
        
        if self.log_file:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(full_log + "\n")
        
        if self.trace_list is not None:
            self.trace_list.extend(nodes)
                
        return nodes

class RAGEngine:
    def __init__(self, llm_model_name=None, log_file=None):
        # Configurar modelos globais
        Settings.embed_model = OllamaEmbedding(
            model_name=EMBEDDING_MODEL, 
            base_url=OLLAMA_BASE_URL,
            request_timeout=OLLAMA_TIMEOUT
        )
        
        model_to_use = llm_model_name if llm_model_name else LLM_MODEL
        self.log_file = log_file
        
        Settings.llm = Ollama(
            model=model_to_use, 
            base_url=OLLAMA_BASE_URL, 
            request_timeout=OLLAMA_TIMEOUT,
            additional_kwargs={"num_thread": os.cpu_count()} # Maximize CPU usage for non-GPU tasks
        )
        
        # Traces for the UI
        self.trace_initial = []
        self.trace_reranked = []

    def get_index(self, domain_config):
        """
        Carrega ou cria um índice vetorial para um domínio específico.
        """
        collection_name = domain_config["collection_name"]
        file_list = domain_config["files"]
        
        # Cliente Qdrant (Persistente no disco) - reutilizar cliente global
        client = get_qdrant_client()
        vector_store = QdrantVectorStore(client=client, collection_name=collection_name)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)

        # Verificar se a coleção já tem dados (simples verificação se existe)
        # Nota: O QdrantClient local verifica a existência ao tentar carregar.
        # Se quisermos forçar re-indexação, teríamos de apagar a coleção.
        
        try:
            # Tenta carregar o índice existente
            index = VectorStoreIndex.from_vector_store(
                vector_store,
                storage_context=storage_context
            )
            # Se a coleção estiver vazia, o LlamaIndex muitas vezes não falha mas retorna vazio.
            # Vamos assumir que se o cliente tem a coleção, está ok.
            # Para ser mais robusto, poderíamos verificar client.count(collection_name).
            if client.collection_exists(collection_name) and client.count(collection_name).count > 0:
                logger.info(f"📚 Index '{collection_name}' loaded from disk.")
                return index
        except Exception as e:
            logger.info(f"⚠️ Index not found or empty. Creating new...")

        # --- SE NÃO EXISTIR, CRIAR ---
        logger.info(f"🔄 Ingesting files: {file_list}")
        
        # Construir caminhos completos
        file_paths = [os.path.join(DATA_DIR, f) for f in file_list]
        
        # Verificar se ficheiros existem
        valid_paths = [p for p in file_paths if os.path.exists(p)]
        if not valid_paths:
            raise FileNotFoundError(f"No files found at: {file_paths}")

        # Ler documentos
        reader = SimpleDirectoryReader(input_files=valid_paths)
        documents = reader.load_data()

        # Criar índice (isto faz o embedding e guarda no Qdrant)
        index = VectorStoreIndex.from_documents(
            documents,
            storage_context=storage_context,
            show_progress=True
        )
        logger.info("✅ Indexing completed successfully.")
        return index

    def get_chat_engine(self, index):
        """
        Creates a chat engine with reranking and logging enabled.
        """
        # Initialize Reranker
        reranker = SentenceTransformerRerank(
            model=RERANKER_MODEL, top_n=3
        )

        return index.as_chat_engine(
            chat_mode="context",
            system_prompt=SYSTEM_PROMPT,
            similarity_top_k=10,  # Fetch more initially (10) to allow reranker to select best (3)
            node_postprocessors=[
                RetrievalLogger("1. Initial Retrieval (Top 10)", self.log_file, self.trace_initial),
                reranker,
                RetrievalLogger("2. After Reranking (Final Context for LLM)", self.log_file, self.trace_reranked)
            ]
        )

    def assess_applicability_multistep(self, domain_config, model_name, case_text):
        """
        Executes a 3-step applicability assessment for a specific domain using the RACE framework.
        """
        start_total = time.perf_counter()
        # Sanitize user input (A03: Injection mitigation)
        case_text = sanitize_prompt(case_text)
        
        # Re-initialize LLM to ensure the correct model is used for the assessment
        Settings.llm = Ollama(
            model=model_name, 
            base_url=OLLAMA_BASE_URL, 
            request_timeout=OLLAMA_TIMEOUT,
            context_window=16384, # Reduced from 32k for better VRAM stability
            additional_kwargs={"num_thread": 14} # Restricted to 14 CPU cores
        )
        
        domain_name = domain_config['name']
        index = self.get_index(domain_config)
        
        # Reset traces for this run
        self.trace_initial.clear()
        self.trace_reranked.clear()
        
        rag_engine = self.get_chat_engine(index)
        
        # --- STEP 1: Criteria Extraction ---
        step1_start = time.perf_counter()
        step1_prompt = f"""You are a regulatory applicability extraction expert specializing in the European Union {domain_name}.
Extract the applicability rules as a Multi-Dimensional Scoping Matrix that determines if the {domain_name} applies to an organization.
Identify the required scoping dimensions:
1. Geographic / Jurisdictional Scope (Where must the entity be, or where must the data subjects be?)
2. Sectoral / Typological Scope (What specific industries, products, or services fall under this?)
3. Data / Processing Scope (What type of data or activity triggers this?)
4. Exemptions & Thresholds (Are micro-enterprises excluded? Are certain sectors carved out?)

Return ONLY the defined dimensions clearly labeled. Do not include introductory text or explanations."""
        
        step1_tokens = (0, 0)
        try:
            # We use RAG for Step 1 to ensure criteria are extracted directly from the regulation
            step1_response = rag_engine.chat(step1_prompt)
            criteria_list = str(step1_response).strip()
            
            # Extract tokens
            if hasattr(step1_response, 'raw') and isinstance(step1_response.raw, dict):
                step1_tokens = (step1_response.raw.get('prompt_eval_count', 0), step1_response.raw.get('eval_count', 0))
        except Exception as e:
            logger.error(sanitize_log(f"Step 1 failed for {domain_name}: {e}"))
            criteria_list = "Error determining criteria."
        step1_time = time.perf_counter() - step1_start

        # Clear traces from Step 1 so that Step 2 trace only contains evaluation context
        self.trace_initial.clear()
        self.trace_reranked.clear()

        # --- STEP 2: In-Depth RAG Evaluation ---
        step2_start = time.perf_counter()
        step2_prompt = f"""You are a regulatory applicability analyst for the {domain_name}.
Evaluate the provided company case against these extracted scoping dimensions:
{criteria_list}

Use the retrieved regulatory context to factually check if the company meets each dimension.
Analyze the geographic scope separately from the sectoral scope, etc., providing evidence to determine if the company falls into the "blast radius" of that specific dimension. Do not audit their security posture.

The company details are:
{case_text}

Provide a step-by-step evaluation. For each dimension, state "Met", "Not Met", or "Unclear", followed by a brief, evidence-based justification from the context."""
        
        step2_tokens = (0, 0)
        try:
            step2_response = rag_engine.chat(step2_prompt)
            evaluation_text = str(step2_response).strip()
            
            # Extract tokens
            if hasattr(step2_response, 'raw') and isinstance(step2_response.raw, dict):
                step2_tokens = (step2_response.raw.get('prompt_eval_count', 0), step2_response.raw.get('eval_count', 0))

            # Capture the traces that were used in Step 2
            def local_format_nodes(nodes):
                if not nodes: return ""
                formatted = []
                for n in nodes:
                    score_str = f"{n.score:.4f}" if n.score is not None else "None"
                    formatted.append(f"--- SOURCE NODE (Score: {score_str}) ---\n{n.node.get_content()}")
                return "\n\n".join(formatted)
            
            initial_trace = local_format_nodes(self.trace_initial)
            reranked_trace = local_format_nodes(self.trace_reranked)
        except Exception as e:
            logger.error(sanitize_log(f"Step 2 failed for {domain_name}: {e}"))
            logger.error(sanitize_log(traceback.format_exc()))
            evaluation_text = f"Error performing RAG evaluation: {e}"
            initial_trace = ""
            reranked_trace = ""
        step2_time = time.perf_counter() - step2_start

        # --- STEP 3: Final Applicability Decision ---
        step3_start = time.perf_counter()
        step3_prompt = f"""You are an Applicability Synthesis Coordinator.
Make a final, definitive decision on whether the {domain_name} is applicable to this company based on the analyst's evaluation of the dimensions.
Determine if the intersection of those dimensions places the company within the regulation's scope. Do not perform a risk assessment or audit of their security posture.

The company profile is:
{case_text}

The applicability evaluation is:
{evaluation_text}

Provide a concise summary conclusion. Instead of plain text, format your final response strictly as a single Markdown table with the following columns:
| Regulation | Status | Role | Justification | Implications |

For example:
| **GDPR**<br>*(General Data Protection Regulation)* | **Standard** | **Hybrid Role**<br>(Controller & Processor) | **Jurisdiction:** EU Domicile.<br>**Data:** Processing of PII... | **Technical:** Implementation of encryption... |"""
        
        step3_tokens = (0, 0)
        try:
            # Again, use generic LLM to synthesize the final decision based on the provided text
            step3_response = Settings.llm.complete(step3_prompt)
            final_decision = str(step3_response).strip()
            
            # Extract tokens
            if hasattr(step3_response, 'raw') and isinstance(step3_response.raw, dict):
                step3_tokens = (step3_response.raw.get('prompt_eval_count', 0), step3_response.raw.get('eval_count', 0))
        except Exception as e:
            logger.error(sanitize_log(f"Step 3 failed for {domain_name}: {e}"))
            final_decision = "Error generating final decision."
        step3_time = time.perf_counter() - step3_start
        
        total_time = time.perf_counter() - start_total
        total_prompt_tokens = step1_tokens[0] + step2_tokens[0] + step3_tokens[0]
        total_gen_tokens = step1_tokens[1] + step2_tokens[1] + step3_tokens[1]
        tokens_per_sec = round(total_gen_tokens / total_time, 2) if total_time > 0 else 0
            
        return {
            "domain": domain_name,
            "step1_criteria": criteria_list,
            "step2_evaluation": evaluation_text,
            "step3_decision": final_decision,
            "trace": {
                "initial": initial_trace,
                "reranked": reranked_trace
            },
            "metrics": {
                "steps_breakdown": {
                    "step1_extract": round(step1_time, 2),
                    "step2_eval": round(step2_time, 2),
                    "step3_synth": round(step3_time, 2)
                },
                "total_time": round(total_time, 2),
                "tokens": {
                    "prompt": total_prompt_tokens,
                    "generated": total_gen_tokens,
                    "tps": tokens_per_sec
                },
                "system": {
                    "ollama_ram_gb": get_ollama_memory(),
                    "gpu_vram_mb": get_gpu_vram()
                }
            }
        }