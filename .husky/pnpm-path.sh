# Shared PATH bootstrap for husky hooks.
#
# GUI git clients (GitHub Desktop, VS Code's built-in Source Control, etc.)
# often invoke hooks with a minimal/sandboxed PATH that doesn't include
# wherever Node/pnpm were installed (nvm, volta, Homebrew/Linuxbrew, a
# Flatpak-sandboxed app's own /usr/bin, ...), causing:
#   ".husky/pre-commit: line 1: pnpm: command not found"
# even though `pnpm` works fine from a normal terminal.
#
# This script widens PATH with common install locations before the hook
# tries to run pnpm, so hooks work the same from any git client. If pnpm
# still can't be found, the hook warns and skips instead of hard-blocking
# the commit — CI (.github/workflows/ci.yml) runs lint/typecheck/build on
# every push regardless, so this is a convenience, not the enforcement gate.

if ! command -v pnpm >/dev/null 2>&1; then
  for dir in \
    "$HOME/.local/share/pnpm" \
    "$HOME/.nvm/current/bin" \
    "$HOME/.volta/bin" \
    "$HOME/.local/bin" \
    /home/linuxbrew/.linuxbrew/bin \
    /opt/homebrew/bin \
    /usr/local/bin \
    /usr/bin
  do
    if [ -x "$dir/pnpm" ]; then
      PATH="$dir:$PATH"
      break
    fi
  done

  # Try the latest installed nvm node version's bin dir, if nvm is present.
  if ! command -v pnpm >/dev/null 2>&1 && [ -d "$HOME/.nvm/versions/node" ]; then
    nvm_bin=$(find "$HOME/.nvm/versions/node" -maxdepth 2 -type d -name bin 2>/dev/null | sort -V | tail -1)
    [ -n "$nvm_bin" ] && PATH="$nvm_bin:$PATH"
  fi

  export PATH
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "husky: pnpm not found on PATH (likely a sandboxed git client, e.g. a Flatpak app)." >&2
  echo "husky: skipping this hook — CI still runs lint/typecheck/build on push." >&2
  echo "husky: to enforce this locally, commit from a terminal where 'pnpm -v' works." >&2
  exit 0
fi
