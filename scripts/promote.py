#!/usr/bin/env python3
"""Copy exactly the staging image digest to production.

This is a proposal helper, NOT staging-health verification or deployment.
The caller must independently verify healthy staging and obtain admin PR approval.
"""
from pathlib import Path
from runpy import run_path

from validate import validate_common, validate_environment

# The command-line tool is intentionally spelled set-digest.py, which is not
# importable with Python module syntax. Load its safe editing function by path.
set_digest = run_path(str(Path(__file__).with_name("set-digest.py")))["set_digest"]


def main():
    validate_common()
    digest = validate_environment("staging", deployable=True)
    target = set_digest("production", digest)
    validate_environment("production", deployable=True)
    print("Prepared production overlay: " + str(target))
    print("NEXT: verify staging health and observed digest, open a PR and obtain admin approval.")
    print("Do not sync production before PR merge and authorization.")


if __name__ == "__main__":
    main()
