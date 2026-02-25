# Tiptap Mermaid for Obsidian

Renders `:::mermaid` container directives (Tiptap/markdown-it-container format) as Mermaid diagrams in Obsidian's **Reading View**.

## The problem

If you use [Tiptap](https://tiptap.dev/) editor with `markdown-it-container`, your Mermaid diagrams are stored as:

```markdown
:::mermaid
graph LR
    A --> B --> C
:::
```

Obsidian only understands fenced code blocks (` ```mermaid `), so these `:::mermaid` blocks show up as raw text.

## What this plugin does

This plugin detects `:::mermaid ... :::` blocks in Reading View and renders them as SVG diagrams using Obsidian's built-in Mermaid renderer. No conversion needed — your source files stay compatible with Tiptap.

## Installation

### From Community Plugins (recommended)

1. Open **Settings** > **Community plugins** > **Browse**
2. Search for "Tiptap Mermaid"
3. Click **Install**, then **Enable**

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/leolionart/obsidian-tiptap-mermaid/releases/latest)
2. Create a folder `.obsidian/plugins/tiptap-mermaid/` in your vault
3. Copy the three files into that folder
4. Enable the plugin in **Settings** > **Community plugins**

## Supported syntax

```markdown
:::mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[End]
:::
```

All standard Mermaid diagram types are supported (flowchart, sequence, class, state, ER, Gantt, pie, etc.).

## Limitations

- **Reading View only** — Live Preview (Source/Edit mode) is not supported due to CodeMirror 6 block decoration constraints.
- Requires Obsidian's built-in Mermaid renderer to be available.

## Development

```bash
# Install dependencies
npm install

# Build with watch mode for development
npm run dev

# Production build
npm run build
```

## License

[MIT](LICENSE)
