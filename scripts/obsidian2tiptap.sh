#!/usr/bin/env bash
# Convert ```mermaid ... ``` (Obsidian) → :::mermaid ... ::: (Tiptap)
# Usage: ./scripts/obsidian2tiptap.sh <file|directory> [--dry-run]
set -euo pipefail

DRY_RUN=false
TARGET=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *) TARGET="$arg" ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 <file|directory> [--dry-run]"
  echo "  Converts \`\`\`mermaid ... \`\`\` → :::mermaid ... :::"
  exit 1
fi

convert_file() {
  local file="$1"
  if ! grep -q '```mermaid' "$file" 2>/dev/null; then
    return
  fi

  local tmp
  tmp=$(mktemp)
  local inside=false
  local changed=false

  while IFS= read -r line || [[ -n "$line" ]]; do
    trimmed="${line#"${line%%[![:space:]]*}"}"
    if [[ "$inside" == false && "$trimmed" == '```mermaid' ]]; then
      echo ':::mermaid' >> "$tmp"
      inside=true
      changed=true
    elif [[ "$inside" == true && "$trimmed" == '```' ]]; then
      echo ':::' >> "$tmp"
      inside=false
    else
      echo "$line" >> "$tmp"
    fi
  done < "$file"

  if [[ "$changed" == true ]]; then
    if [[ "$DRY_RUN" == true ]]; then
      echo "[dry-run] would convert: $file"
    else
      mv "$tmp" "$file"
      echo "converted: $file"
    fi
  else
    rm "$tmp"
  fi
}

count=0
if [[ -f "$TARGET" ]]; then
  convert_file "$TARGET"
elif [[ -d "$TARGET" ]]; then
  while IFS= read -r -d '' f; do
    convert_file "$f"
    ((count++)) || true
  done < <(find "$TARGET" -name '*.md' -print0)
else
  echo "Error: $TARGET is not a file or directory"
  exit 1
fi
