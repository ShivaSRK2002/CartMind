"""CLI entrypoint.

Usage:
  python pipeline.py train   # train on synthetic data, write models/metrics.json
  python pipeline.py score   # score the live DB with the trained models
  python pipeline.py all     # train, then score
"""

import sys

from . import score, train


def main() -> None:
    action = sys.argv[1] if len(sys.argv) > 1 else "all"

    if action in ("train", "all"):
        train.main()
    if action in ("score", "all"):
        score.main()
    if action not in ("train", "score", "all"):
        print(f"Unknown action '{action}'. Use train | score | all.")
        sys.exit(1)


if __name__ == "__main__":
    main()
