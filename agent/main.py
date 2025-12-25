"""Blog Factory - Main Orchestrator Entry Point.

This module implements the main orchestration loop following
Anthropic's two-agent pattern (initializer + coding agent).

Usage:
    uv run blog-factory
    uv run blog-factory --max-iterations 5
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
FEATURE_LIST = DATA_DIR / "feature_list.json"
PROGRESS_FILE = DATA_DIR / "claude-progress.txt"


def load_feature_list() -> dict:
    """Load the feature list from JSON."""
    with open(FEATURE_LIST, encoding="utf-8") as f:
        return json.load(f)


def get_next_feature(feature_list: dict) -> dict | None:
    """Find the next incomplete feature to work on."""
    for _phase_name, phase_data in feature_list["phases"].items():
        if phase_data["status"] == "pending":
            continue
        for feature in phase_data.get("features", []):
            if not feature["passing"]:
                return feature
    return None


def update_progress(message: str) -> None:
    """Append a message to the progress file."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(PROGRESS_FILE, "a", encoding="utf-8") as f:
        f.write(f"\n[{timestamp}] {message}")


def main() -> int:
    """Main entry point for the orchestrator."""
    parser = argparse.ArgumentParser(description="Blog Factory Orchestrator")
    parser.add_argument(
        "--max-iterations",
        type=int,
        default=10,
        help="Maximum number of iterations per session",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without executing",
    )
    args = parser.parse_args()

    print("=" * 50)
    print("Blog Factory - Autonomous Content Engine")
    print("=" * 50)
    print()

    # Load feature list
    try:
        feature_list = load_feature_list()
        stats = feature_list.get("statistics", {})
        print(f"Progress: {stats.get('passing', 0)}/{stats.get('total_features', 0)} features")
        print(f"Completion: {stats.get('completion_percentage', 0):.1f}%")
    except FileNotFoundError:
        print("ERROR: feature_list.json not found")
        print("Run: ./scripts/init.sh")
        return 1

    # Find next feature
    next_feature = get_next_feature(feature_list)
    if next_feature is None:
        print("\nAll features complete! 🎉")
        return 0

    print(f"\nNext feature: #{next_feature['id']}")
    print(f"  Category: {next_feature['category']}")
    print(f"  Description: {next_feature['description']}")

    if "steps" in next_feature:
        print("  Steps:")
        for step in next_feature["steps"]:
            print(f"    - {step}")

    if args.dry_run:
        print("\n[Dry run - no actions taken]")
        return 0

    # Update progress
    update_progress(f"Starting feature #{next_feature['id']}: {next_feature['description']}")

    print("\n" + "=" * 50)
    print("Ready for Claude Code to take over.")
    print("Use /orchestrate command to begin.")
    print("=" * 50)

    return 0


if __name__ == "__main__":
    sys.exit(main())
