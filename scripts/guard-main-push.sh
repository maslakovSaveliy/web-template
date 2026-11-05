#!/bin/sh
# Blocks pushes that update main on the remote (GitHub Free has no branch protection on
# private repos). Reads git's pre-push stdin: "<local ref> <local sha> <remote ref> <remote sha>",
# so `git push origin HEAD:main` from a feature branch is caught too.
# Work goes through feat/<slug> or fix/<slug> branches and a PR with green CI.
# One-off override (owner only): ALLOW_MAIN_PUSH=1 git push
set -eu

if [ "${ALLOW_MAIN_PUSH:-0}" = "1" ]; then
  exit 0
fi

while read -r _local_ref _local_sha remote_ref _remote_sha; do
  if [ "$remote_ref" = "refs/heads/main" ]; then
    echo "✖ Push to main is blocked. Push a feat/ or fix/ branch and open a PR." >&2
    exit 1
  fi
done

exit 0
