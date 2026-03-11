import logging
import sys

def setup_logger(name=__name__):
    """
    Configures and returns a logger with standard formatting, writing to both stdout and a specific file.
    """
    import os
    from pathlib import Path
    
    # Define secure log directory
    log_dir = Path(__file__).parent.parent / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "application.log"
    
    # Ensure file has restrictive permissions if it already exists or when we create it
    # We will rely on OS permissions for the directory
    
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        
        # File Handler
        fh = logging.FileHandler(log_file)
        fh.setFormatter(formatter)
        logger.addHandler(fh)
        
        # Console Handler
        ch = logging.StreamHandler(sys.stdout)
        ch.setFormatter(formatter)
        logger.addHandler(ch)
        
    return logger

def get_ollama_memory():
    """
    Finds the ollama process and returns its memory usage in GB.
    """
    try:
        import psutil
        total_memory = 0
        for proc in psutil.process_iter(['name', 'memory_info']):
            if 'ollama' in proc.info['name'].lower():
                total_memory += proc.info['memory_info'].rss
        return round(total_memory / (1024 ** 3), 2)  # Convert to GB
    except Exception:
        return 0.0

def get_gpu_vram():
    """
    Executes nvidia-smi to get current GPU VRAM usage in MB.
    """
    try:
        import subprocess
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"],
            capture_output=True, text=True, check=True
        )
        return int(result.stdout.strip())
    except Exception:
        return 0

def sanitize_prompt(text: str, max_length: int = 10000) -> str:
    """
    Sanitizes user input to prevent prompt injection and resource exhaustion.
    1. Truncates length.
    2. Neutralizes common injection and formatting breakout sequences.
    """
    if not text:
        return ""
    
    # 1. Truncate to prevent long-input resource exhaustion (Dos)
    text = text[:max_length]
    
    # 2. Neutralize markdown breakout (triple backticks)
    text = text.replace("```", "'''")
    
    # 3. Neutralize common instruction-override keywords if they appear as standalone markers
    # We use case-insensitive replacement for broad coverage
    import re
    
    # Patterns that look like system/instruction overrides
    injection_patterns = [
        r"(?i)ignore\W+all\W+previous\W+instructions",
        r"(?i)ignore\W+the\W+instructions",
        r"(?i)you\W+are\W+now\W+a",
        r"(?i)system\W+prompt:",
        r"(?i)###\W+instruction",
        r"(?i)\[\W*system\W*\]"
    ]
    
    sanitized = text
    for pattern in injection_patterns:
        sanitized = re.sub(pattern, "[FILTERED_INSTRUCTION]", sanitized)
    
    return sanitized.strip()

def mask_sensitive_data(text: str) -> str:
    """
    Masks JWTs and potential credentials from strings to prevent accidental log leakage (A09).
    """
    if not text:
        return ""
    
    import re
    # Mask JWT-like patterns (Base64 encoded JSON)
    jwt_pattern = r"eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*"
    # Mask password fields in JSON/Dictionary strings
    password_json_pattern = r'([\"\']password[\"\']\s*:\s*[\"\'])[^\"\']+([\"\'])'
    
    masked = re.sub(jwt_pattern, "[MASKED_JWT]", text)
    masked = re.sub(password_json_pattern, r'\1[REDACTED]\2', masked)
    
    return masked

def sanitize_log(text: str) -> str:
    """
    Sanitizes string for logging by neutralizing newline characters (V7.4.2)
    and masking sensitive data (V7.3.3).
    """
    if not text:
        return ""
    text = str(text)
    # Prevent log injection (CRLF)
    text = text.replace('\n', ' [NL] ').replace('\r', ' [CR] ')
    # Mask sensitive credentials
    return mask_sensitive_data(text)