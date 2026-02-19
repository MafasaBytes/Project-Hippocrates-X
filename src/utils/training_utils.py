import logging
from pathlib import Path

def setup_logging(log_dir: Path, tag: str):
    log_dir.mkdir(exist_ok=True, parents=True)
    log_file = log_dir / f"train_{tag}_{time.strftime('%Y%m%d_%H%M%S')}.log"
    
    # Configure logging to both console and file
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return log_file