# Apple Notes MCP

A [Model Context Protocol](https://modelcontextprotocol.io/) server for **Apple Notes** on macOS. It lets any MCP-compatible AI client (Claude Desktop, opencode, Cursor, etc.) read, create, update, delete, search, and organize your Apple Notes.

## How it works

The server communicates with the macOS Notes app through **AppleScript** (`osascript`). Each MCP tool maps to an AppleScript command that queries or mutates your Notes database. All user-supplied strings are escaped to prevent injection.

Transport is **stdio** — the MCP client spawns this server as a child process and communicates over stdin/stdout.

## Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `list-folders` | List all Notes folders | — |
| `list-notes` | List notes, optionally filtered by folder | `folder?` |
| `get-note` | Read note content by ID | `id`, `format: "html" \| "text"` |
| `create-note` | Create a new note | `name`, `body`, `folder?` |
| `update-note` | Update a note's title and/or body | `id`, `name?`, `body?` |
| `delete-note` | Delete a note by ID | `id` |
| `search-notes` | Full-text search across all notes | `query` |
| `move-note` | Move a note to a different folder | `id`, `folder` |

## Requirements

- **macOS** (tested on macOS 14+ Sonoma, should work on Ventura and later)
- **Node.js** 18+
- **Apple Notes** app (bundled with macOS)

## Installation

```bash
git clone https://github.com/<your-username>/apple-notes-mcp.git
cd apple-notes-mcp
npm install
npm run build
```

## Configuration

### opencode

Add to `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "apple-notes": {
      "type": "local",
      "command": ["node", "/path/to/apple-notes-mcp/dist/index.js"]
    }
  }
}
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "apple-notes": {
      "command": "node",
      "args": ["/path/to/apple-notes-mcp/dist/index.js"]
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "apple-notes": {
      "command": "node",
      "args": ["/path/to/apple-notes-mcp/dist/index.js"]
    }
  }
}
```

## Permissions

On first use, macOS will prompt you to grant **Automation** access to control the Notes app. Click **Allow**. If you accidentally deny it, go to **System Settings > Privacy & Security > Automation** and re-enable it for your terminal or MCP client.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev
```

## Architecture

```
src/
├── applescript.ts   # AppleScript execution layer (osascript wrapper)
└── index.ts         # MCP server with tool definitions
```

- **`applescript.ts`** — Executes AppleScript snippets via `child_process.execFile("osascript", ...)`. Exports typed async functions for each Notes operation. Handles escaping and parsing of tab-delimited output.
- **`index.ts`** — Defines the MCP server and registers 8 tools with Zod-validated schemas. Uses `@modelcontextprotocol/sdk` for protocol handling and stdio transport.

## Limitations

- **macOS only** — relies on AppleScript and the native Notes app.
- **No attachments** — AppleScript access to note attachments is limited; this server works with text content only.
- **No iCloud sync control** — the server interacts with the local Notes database; sync behavior is handled by macOS.
- **AppleScript performance** — operations involve spawning `osascript` processes, so very large note collections may be slow to list or search.

## License

MIT
