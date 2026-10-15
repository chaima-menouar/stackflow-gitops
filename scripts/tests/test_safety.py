"""Offline safety checks for GitOps configuration and digest tooling."""
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"


class GitOpsSafetyTest(unittest.TestCase):
    def run_script(self, name, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPTS / name), *args],
            cwd=ROOT, capture_output=True, text=True, check=False,
        )

    def test_scaffold_validates(self):
        result = self.run_script("validate.py")
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_invalid_digest_cannot_change_environment(self):
        path = ROOT / "apps/demo/overlays/staging/kustomization.yaml"
        original = path.read_bytes()
        result = self.run_script("set-digest.py", "--environment", "staging",
                                 "--digest", "latest")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(path.read_bytes(), original)

    def test_production_promotion_requires_real_staging_digest(self):
        # Never modify the real production overlay from a safety test.
        from yaml import safe_load
        with (ROOT / "apps/demo/overlays/staging/kustomization.yaml").open(encoding="utf-8") as stream:
            image_digest = safe_load(stream)["images"][0]["digest"]
        if image_digest != "sha256:" + "0" * 64:
            self.skipTest("only applicable before the initial staging release")
        result = self.run_script("promote.py")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("bootstrap digest is not deployable", result.stderr)

    def test_zero_digest_cannot_be_promoted_to_staging(self):
        result = self.run_script("set-digest.py", "--environment", "staging",
                                 "--digest", "sha256:" + "0" * 64)
        self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
