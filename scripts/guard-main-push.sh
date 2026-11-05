#!/bin/sh
# Blocks direct pushes to main (GitHub Free has no branch protection on private repos).
# Work goes through feat/<slug> or fix/<slug> branches and a PR with green CI.
# One-off override (owner only): ALLOW_MAIN_PUSH=1 git push
set -eu

if [ "${ALLOW_MAIN_PUSH:-0}" = "1" ]; then
  exit 0
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "$branch" = "main" ]; then
  echo "✖ Direct push to main is blocked. Push a feat/ or fix/ branch and open a PR." >&2
  exit 1
fi
