"""Repo-root-friendly entrypoint: `python apps/ml/pipeline.py train|score|all`.

Thin wrapper that puts src/ on the path so cartmind_ml's relative imports
work without requiring `python -m` or a package install.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from cartmind_ml.pipeline import main  # noqa: E402

if __name__ == "__main__":
    main()
