import logging
import sys

def setup_logger(name=__name__):
    """
    Configures and returns a logger with standard formatting.
    """
    logging.basicConfig(stream=sys.stdout, level=logging.INFO, 
                        format='%(asctime)s - %(levelname)s - %(message)s')
    return logging.getLogger(name)

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