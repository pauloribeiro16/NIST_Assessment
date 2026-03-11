import os
import time
import datetime
import requests
import beaupy
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.markdown import Markdown
from rich.progress import Progress, SpinnerColumn, TextColumn
from typing import List, Dict, Tuple, Any
from src.utils import sanitize_prompt, mask_sensitive_data

OLLAMA_API_BASE_URL = os.getenv("OLLAMA_API_BASE_URL", "http://localhost:11434/api")
OLLAMA_GENERATE_ENDPOINT_SUFFIX = "/generate"
OLLAMA_TAGS_ENDPOINT_SUFFIX = "/tags"
OLLAMA_REQUEST_TIMEOUT_SECONDS = 3000
OLLAMA_KEEP_ALIVE_DURATION = "5m"
LOG_DIR_NAME = "weighted_council_logs"

console = Console()

# --- BASE DE DADOS DE COMPETÊNCIA (Extraído da tua imagem) ---
# Apenas modelos nesta lista aparecerão para seleção.
MODEL_SCORES = {
    "gpt-oss:20b": 97.5,
    "glm-4.7-flash:latest": 96.65,
    "ministral-3:latest": 95.0,
    "phi4:14b": 93.75,
    "qwen3:8b": 92.5,
    "granite4:latest":92.5,
    "qwen3:14b": 90.0,
    "qwen3:1.7b": 88.75,
    "gemma3n:e4b": 86.25,
    "granite3.2:8b": 86.25,
    "gemma3n:e2b": 83.75,
    "mistral:7b": 81.25,
    "gemma3:4b": 81.25,
    "deepseek-r1:7b": 77.5,
    "granite3.3:8b": 75.0,
    "ibm/granite3.2:2b": 73.75,
    "llama3.2:1b": 68.75,
    "qwen3:0.6b": 66.25,
    "qwen3:4b": 95.00,
    "deepseek-r1:1.5b": 53.75,
    "gemma3:1b": 51.25,
    "rnj-1:latest": 90.0,
    "lfm2.5-thinking:latest": 85.0,
}

# --- TEMPLATE DE RESPOSTA (FASE A - INDIVIDUAL) ---
TEMPLATE_INDIVIDUAL = """
STRICT OUTPUT FORMAT:
You must structure your response exactly as follows:

### 1. Executive Summary
[Brief overview of the scenario and options]

### 2. Trade-off Analysis
**Option A:** [Name]
*   **Pros:** [List]
*   **Cons:** [List]

**Option B:** [Name]
*   **Pros:** [List]
*   **Cons:** [List]

### 3. Comparative Table
| Factor | Option A | Option B |
| :--- | :--- | :--- |
| Cost/Effort | ... | ... |
| Security Impact | ... | ... |
| Operational Risk | ... | ... |
| [Other Factor] | ... | ... |
"""

# --- TEMPLATE DE RESPOSTA (FASE C - DEBATE) ---
TEMPLATE_DEBATE = """
STRICT OUTPUT FORMAT:
You must structure your response exactly as follows:

### 1. Executive Summary
[Brief overview of the scenario and options]

### 2. Trade-off Analysis
**Option A:** [Name]
*   **Pros:** [List]
*   **Cons:** [List]

**Option B:** [Name]
*   **Pros:** [List]
*   **Cons:** [List]

### 3. Peer Perspective Evaluation
[Analyze the inputs from other models provided in the prompt.]
*   **Peer Insights:** [What views did they provide? Are they valid?]
*   **Critique:** [What did they miss? Are there logical gaps?]

### 4. Comparative Table
| Factor | Option A | Option B |
| :--- | :--- | :--- |
| Cost/Effort | ... | ... |
| Security Impact | ... | ... |
| Operational Risk | ... | ... |
| [Other Factor] | ... | ... |

"""

# --- TEMPLATE DE RESPOSTA (FASE FINAL - CONSENSO) ---
TEMPLATE_CONSENSUS = """
STRICT OUTPUT FORMAT:
You must structure your response exactly as follows:

### 1. Executive Summary of Options
[Brief overview of the main approaches discussed by the council.]

### 2. Fact-Based Aggregation
[Synthesize the key arguments from all models. Do not pick a winner, just present the strongest points.]
*   **Arguments for Option A:** [List key valid points]
*   **Arguments for Option B:** [List key valid points]
*   **Key Risks Identified:** [List critical risks mentioned]

### 3. Divergence Analysis
[Where did the models disagree? Analyze the validity of these disagreements.]
*   **Point of Contention:** [Describe]
    *   **Perspective 1:** [Argument]
    *   **Perspective 2:** [Argument]
    *   **Assessment:** [Do these arguments hold water logically?]

### 4. Decision Matrix (Risk vs. Benefit)
[Create a summary to help the human user decide based on their risk appetite.]
| Scenario / Risk Appetite | Recommended Path | Trade-offs |
| :--- | :--- | :--- |
| [e.g., Low Risk Tolerance] | ... | ... |
| [e.g., Cost-Sensitive] | ... | ... |
| [e.g., High Operational Urgency] | ... | ... |

### 5. Final Note to the Decision Maker
[A neutral closing statement summarizing the landscape of choices.]
"""

# --- PERGUNTAS DE TESTE ---
QUESTIONS = [
    "Scenario: A critical legacy production server has a high-severity RCE vulnerability. Patching requires a reboot and 2 hours of downtime. A Virtual Patch (IPS rule) is available but might block 5% of legitimate traffic. Compare 'Emergency Patching' vs. 'Virtual Patching'. What is the best course of action?",
    "Scenario: A startup needs to secure user logins. Option A is SMS 2FA (cheap, high user adoption). Option B is Hardware Keys/FIDO2 (expensive, low adoption, phishing-resistant). Compare SMS 2FA vs. Hardware Keys. Which should they choose for a high-risk admin portal vs. standard users?",
    "Scenario: An organization is migrating a legacy app to the cloud. Strategy A: Rehost (Lift & Shift) - fast, low code change, but inherits technical debt. Strategy B: Refactor (Cloud-Native) - slow, expensive, but scalable and cheaper to run. Compare Rehost vs. Refactor. What is the best approach for a mission-critical app with variable load?",
    "Scenario: A malware infection is detected on a CEO's laptop. Option A: Isolate immediately (stops spread, alerts attacker). Option B: Monitor/Honeypot (gathers intel on attacker intent, risks data loss). Compare Immediate Isolation vs. Monitoring. What is the best action if the attacker is suspected to be an APT?",
    "Scenario: Choosing a VPN solution for remote work. Option A: Traditional VPN (Full Tunnel) - secure perimeter, high bandwidth usage. Option B: Split Tunneling - better performance, less visibility into direct internet traffic. Compare Full Tunnel vs. Split Tunnel VPN. Which is better for a 'Zero Trust' roadmap?",
    "[Custom Input] Escrever a minha própria pergunta..."
]

# --- LOGGER ---
class CouncilLogger:
    def __init__(self):
        self.filepath = None

    def initialize(self, selected_models: List[str], question: str):
        if not os.path.exists(LOG_DIR_NAME):
            os.makedirs(LOG_DIR_NAME)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        self.filepath = os.path.join(LOG_DIR_NAME, f"weighted_run_{timestamp}.txt")
        
        # Cabeçalho com os Scores
        header = (
            f"=== RELATÓRIO DE CONSELHO PONDERADO ===\n"
            f"Data: {datetime.datetime.now()}\n"
            f"Pergunta: {question}\n"
            f"Modelos Selecionados e Scores:\n"
        )
        for m in selected_models:
            header += f" - {m}: {MODEL_SCORES.get(m, 'N/A')}%\n"
        header += f"{'='*60}\n\n"
        self._write(header)

    def log_turn(self, phase: str, model: str, full_prompt: str, response: str):
        # Mask sensitive data before logging (A09)
        masked_prompt = mask_sensitive_data(full_prompt.strip())
        masked_response = mask_sensitive_data(response.strip())
        
        entry = (
            f"--- [{phase}] MODELO: {model} (Score: {MODEL_SCORES.get(model)}) ---\n"
            f"[PROMPT ENVIADO]:\n{'-'*20}\n{masked_prompt}\n{'-'*20}\n\n"
            f"[RESPOSTA]:\n{masked_response}\n"
            f"\n{'='*60}\n\n"
        )
        self._write(entry)

    def _write(self, text: str):
        if self.filepath:
            with open(self.filepath, "a", encoding="utf-8") as f:
                f.write(text)

# --- FUNÇÕES AUXILIARES ---

def get_valid_models() -> List[str]:
    """Retorna apenas modelos instalados que tenham um Score definido na tabela."""
    try:
        response = requests.get(f"{OLLAMA_API_BASE_URL}{OLLAMA_TAGS_ENDPOINT_SUFFIX}", timeout=2)
        if response.status_code == 200:
            installed_models = [m['name'] for m in response.json()['models']]
            # FILTRAGEM: Interseção entre instalados e a tabela de scores
            valid = [m for m in installed_models if m in MODEL_SCORES]
            return valid
        return []
    except:
        return []

def call_ollama(model_name: str, user_prompt: str, system_prompt: str) -> str:
    payload = {
        "model": model_name,
        "system": system_prompt,
        "prompt": user_prompt,
        "stream": False,
        "keep_alive": OLLAMA_KEEP_ALIVE_DURATION,
        "options": {"enable_thinking": False}
    }
    try:
        resp = requests.post(f"{OLLAMA_API_BASE_URL}{OLLAMA_GENERATE_ENDPOINT_SUFFIX}", json=payload, timeout=OLLAMA_REQUEST_TIMEOUT_SECONDS)
        resp.raise_for_status()
        return resp.json().get("response", "").strip()
    except Exception as e:
        return f"Error: {e}"

# --- FASE A: INFERÊNCIA INDIVIDUAL ---

def run_phase_a_step(model: str, question: str, logger: CouncilLogger) -> str:
    # Sanitize user input (A03: Injection mitigation)
    question = sanitize_prompt(question)
    sys_prompt = f"You are a cybersecurity expert. Analyze the scenario and provide a comprehensive assessment.\n{TEMPLATE_INDIVIDUAL}"
    resp = call_ollama(model, question, sys_prompt)
    logger.log_turn("FASE A", model, f"SYS: {sys_prompt}\nUSER: {question}", resp)
    return resp

def run_phase_a(selected_models: List[str], question: str, logger: CouncilLogger) -> Dict[str, str]:
    results = {}
    console.print(f"\n[bold blue]--- FASE A: INFERÊNCIA INDIVIDUAL ---[/bold blue]")
    
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as progress:
        task = progress.add_task("A consultar modelos...", total=len(selected_models))
        for model in selected_models:
            progress.update(task, description=f"[cyan]Consultando {model} (Score: {MODEL_SCORES[model]})...")
            
            resp = run_phase_a_step(model, question, logger)
            results[model] = resp
            
            progress.advance(task)
            console.print(f"[green]✔ {model}[/green] respondeu.")
    return results

# --- FASE C: DEBATE HIERÁRQUICO (NOVO) ---

def run_debate_round_step(current_model: str, selected_models: List[str], question: str, previous_results: Dict[str, str], logger: CouncilLogger, round_num: int) -> str:
    # Sanitize already sanitized if called from run_phase_a_step, but safe to repeat
    question = sanitize_prompt(question)
    current_score = MODEL_SCORES[current_model]
    
    # CONSTRUIR O CONTEXTO DOS PARES
    peers_context = ""
    for peer, peer_resp in previous_results.items():
        if peer == current_model: continue
        
        peer_score = MODEL_SCORES[peer]
        diff = peer_score - current_score
        
        # LÓGICA DE ZONAS DE INFLUÊNCIA
        rel_type = ""
        guidance = ""

        if abs(diff) < 10:
            rel_type = "PEER (EQUAL AUTHORITY)"
            guidance = "This model has a similar skill level. Treat its arguments as equal to yours. If you disagree, explain why and seek a consensus."
        elif diff >= 10:
            rel_type = "SUPERIOR"
            guidance = "This model is generally more reliable. Give its logic high priority, but if you are certain of a factual error, point it out."
        else: # diff <= -10
            rel_type = "SUBORDINATE"
            guidance = "You are more reliable than this model. Monitor its output for hallucinations."

        peers_context += (
            f"\nFROM {peer} [{rel_type} - Score {peer_score}%]:\n"
            f"{peer_resp}\n"
            f"GUIDANCE: {guidance}\n"
            f"{'-'*50}\n"
        )

    # Obter a própria resposta anterior para reflexão
    my_prev = previous_results.get(current_model, "")

    # O PROMPT DE CONSENSO EMERGENTE
    prompt = f"""
    QUESTION: {question}
    YOUR SCORE: {current_score}%
    
    YOUR PREVIOUS STANCE:
    {my_prev}
    
    CONSENSUS GUIDELINES:
    1. Models with scores within 10 points of each other are 'Peers'. 
    2. If Peers disagree, you must analyze the LOGIC of their arguments.
    3. Do not blindly follow; aim for the most technically sound consensus.
    4. If a consensus is reached among peers, the final answer should reflect it.

    INPUTS FROM OTHERS (CURRENT STATE):
    {peers_context}

    YOUR TASK:
    Review your previous stance and the inputs above. 
    Refine your answer to be more accurate. 
    Synthesize a final expert conclusion for this round.
    
    {TEMPLATE_DEBATE}
    """

    sys_prompt = "You are a collaborative AI expert. You evaluate arguments based on merit and logic."
    
    resp = call_ollama(current_model, prompt, sys_prompt)
    logger.log_turn(f"FASE C (Ronda {round_num})", current_model, prompt, resp)
    return resp

def run_debate_round(selected_models: List[str], question: str, previous_results: Dict[str, str], logger: CouncilLogger, round_num: int) -> Dict[str, str]:
    results = {}
    console.print(f"\n[bold yellow]--- FASE C: DEBATE MERITOCRÁTICO - RONDA {round_num} ---[/bold yellow]")

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as progress:
        task = progress.add_task(f"Ronda {round_num} em curso...", total=len(selected_models))
        
        for current_model in selected_models:
            progress.update(task, description=f"[yellow]{current_model} a analisar pares (Ronda {round_num})...")

            resp = run_debate_round_step(current_model, selected_models, question, previous_results, logger, round_num)
            results[current_model] = resp
            
            progress.advance(task)
            console.print(f"[green]✔ {current_model}[/green] contribuiu para a ronda {round_num}.")

    return results

def run_final_consensus(selected_models: List[str], question: str, final_round_results: Dict[str, str], logger: CouncilLogger):
    # Sanitize user input
    question = sanitize_prompt(question)
    # Identificar o Líder (Score mais alto) para redigir o consenso
    leader_model = max(selected_models, key=lambda k: MODEL_SCORES[k])
    leader_score = MODEL_SCORES[leader_model]
    
    console.print(f"\n[bold magenta]--- FASE FINAL: GERAÇÃO DE CONSENSO (Relator: {leader_model}) ---[/bold magenta]")
    
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as progress:
        task = progress.add_task("A sintetizar consenso final...", total=1)
        
        # Construir contexto da última ronda
        council_context = ""
        for model, resp in final_round_results.items():
            score = MODEL_SCORES[model]
            council_context += f"\nFROM {model} (Score {score}%):\n{resp}\n{'-'*50}\n"

        prompt = f"""
        QUESTION: {question}
        
        ROLE: You are the Chief Analyst of this AI Council.
        YOUR SCORE: {leader_score}% (Highest in the room).
        
        TASK:
        Read the final arguments from all council members below.
        Your goal is NOT to make the final decision, but to aggregate all facts and perspectives into a Decision Support Report.
        The human user will make the final call based on their risk appetite.
        
        1. Validate the arguments: Are they logical?
        2. Expose the trade-offs clearly.
        3. Highlight where models disagreed and why.
        4. Present the options in a way that empowers the human to choose.
        
        COUNCIL ARGUMENTS:
        {council_context}
        
        {TEMPLATE_CONSENSUS}
        """
        
        sys_prompt = "You are the Chief Analyst. Synthesize a neutral decision support report."
        
        resp = call_ollama(leader_model, prompt, sys_prompt)
        
        logger.log_turn("FASE FINAL (Relatório de Decisão)", leader_model, prompt, resp)
        progress.advance(task)
        
    console.print(Panel(Markdown(resp), title=f"📊 RELATÓRIO DE APOIO À DECISÃO ({leader_model})", border_style="magenta"))
    return leader_model, resp

# --- MAIN ---

def main():
    console.clear()
    console.print(Panel.fit("[bold cyan]AI HIERARCHY: Weighted Debate System[/bold cyan]", subtitle="Powered by CyberMetric Scores"))

    # 1. Obter modelos válidos (Interseção Instalados vs Tabela)
    valid_models = get_valid_models()
    
    if not valid_models:
        console.print("[red]ERRO: Nenhum modelo instalado corresponde à lista de scores permitidos.[/red]")
        console.print("Instala modelos como 'phi4:14b' ou 'gpt-oss:20b' para continuar.")
        return

    # Ordenar modelos por score decrescente
    valid_models.sort(key=lambda m: MODEL_SCORES[m], reverse=True)

    # 2. Mostrar Tabela de Escolha com Scores
    model_choices = []
    console.print("\n[bold]Modelos Disponíveis e seus Pesos:[/bold]")
    table = Table(title="CyberMetric Ratings")
    table.add_column("Model Tag", style="cyan")
    table.add_column("Score", style="magenta")
    
    for m in valid_models:
        score = MODEL_SCORES[m]
        table.add_row(m, str(score))
        model_choices.append(m)
    
    console.print(table)

    # 3. Seleção Interativa
    console.print("[bold yellow]Seleciona os modelos para o debate (Espaço para selecionar):[/bold yellow]")
    selected = beaupy.select_multiple(model_choices)
    if not selected: return

    # 4. Seleção Pergunta
    q = beaupy.select(QUESTIONS)
    if q.startswith("[Custom"):
        q = beaupy.prompt("Escreve a pergunta:")

    # 5. Execução
    logger = CouncilLogger()
    logger.initialize(selected, q)

    phase_a = run_phase_a(selected, q, logger)
    
    
    # Loop de Debate
    current_results = phase_a
    round_num = 1
    
    while True:
        current_results = run_debate_round(selected, q, current_results, logger, round_num)
        
        # Mostrar resultados da ronda
        best_model = max(selected, key=lambda k: MODEL_SCORES[k])
        console.print(f"\n[bold yellow]=== RESULTADO DA RONDA {round_num} ===[/bold yellow]")
        console.print(f"[dim]A opinião com maior peso estatístico vem de: {best_model} ({MODEL_SCORES[best_model]}%)[/dim]")
        
        for m, res in current_results.items():
            style = "green" if m == best_model else "white"
            title = f"{m} (Score: {MODEL_SCORES[m]}) {'👑 LÍDER' if m == best_model else ''}"
            console.print(Panel(Markdown(res), title=title, border_style=style))
            
        # Perguntar se continua
        if not beaupy.confirm(f"Continuar para Ronda {round_num + 1}?", default_is_yes=True):
            break
        
        round_num += 1

    # Fase Final de Consenso
    run_final_consensus(selected, q, current_results, logger)

    console.print(f"\n[blue]Log detalhado guardado em: {logger.filepath}[/blue]")

if __name__ == "__main__":
    main()