#!/usr/bin/env python3
"""Copy exactly the staging image digest to production.

This is a proposal helper, NOT staging-health verification or deployment.
The caller must independently verify healthy staging and obtain admin PR approval.
"""
from validate import ZERO, validate_common, validate_environment
from set_digest import set_digest


def main():
    validate_common()
    digest = validate_environment("staging", deployable=True)
    if digest == ZERO:
        raise ValueError("cannot promote an unpublished image")
    target = set_digest("production", digest)
    validate_environment("production", deployable=True)
    print("Prepared production overlay: " + str(target))
    print("NEXT: verify staging health and observed digest, open a PR and obtain admin approval.")
    print("Do not sync production before PR merge and authorization.")


if __name__ == "__main__":
    main()
