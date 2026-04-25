# Apple macOS MCP

A [Model Context Protocol](https://modelcontextprotocol.io/) server for **Apple Notes, Calendar, and Reminders** on macOS. It lets any MCP-compatible AI client (Claude Desktop, opencode, Cursor, etc.) read, create, update, delete, and search your macOS data.

## How it works

The server communicates with native macOS apps through **AppleScript** (`osascript`). Each MCP tool maps to an AppleScript command that queries or mutates your data. All user-supplied strings are escaped to prevent injection.

Transport is **stdio** — the MCP client spawns this server as a child process and communicates over stdin/stdout.

## Tools (22 total)

### Notes (8 tools)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `notes-list-folders` | List all Notes folders | — |
| `notes-list` | List notes, optionally filtered by folder | `folder?` |
| `notes-get` | Read note content by ID | `id`, `format: "html" \| "text"` |
| `notes-create` | Create a new note | `name`, `body`, `folder?` |
| `notes-update` | Update a note's title and/or body | `id`, `name?`, `body?` |
| `notes-delete` | Delete a note by ID | `id` |
| `notes-search` | Full-text search across all notes | `query` |
| `notes-move` | Move a note to a different folder | `id`, `folder` |

### Calendar (6 tools)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `calendar-list` | List all calendars | — |
| `calendar-today` | Get today's agenda across all calendars | — |
| `calendar-events` | List events in a date range | `calendar`, `fromDate`, `toDate` |
| `calendar-get-event` | Get event details by ID | `id` |
| `calendar-create-event` | Create a new event | `calendar`, `summary`, `startDate`, `endDate`, `location?`, `description?` |
| `calendar-delete-event` | Delete an event by ID | `id` |

### Reminders (8 tools)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `reminders-lists` | List all reminder lists | — |
| `reminders-list` | List reminders, optionally by list | `list?`, `showCompleted?` |
| `reminders-create` | Create a new reminder | `name`, `list?`, `dueDate?`, `body?`, `priority?` |
| `reminders-update` | Update a reminder's properties | `id`, `name?`, `body?`, `dueDate?`, `priority?` |
| `reminders-complete` | Mark a reminder as completed | `id` |
| `reminders-uncomplete` | Mark a reminder as incomplete | `id` |
| `reminders-delete` | Delete a reminder | `id` |

## Requirements

- **macOS** (tested on macOS 14+ Sonoma, should work on Ventura and later)
- **Node.js** 18+
- **Apple Notes, Calendar, Reminders** (bundled with macOS)

## Installation

```bash
git clone https://github.com/Rohit-Yadav-47/apple-macos-mcp.git
cd apple-macos-mcp
npm install
npm run build
```

## Configuration

### opencode

Add to `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "apple-macos": {
      "type": "local",
      "command": ["node", "/path/to/apple-macos-mcp/dist/index.js"]
    }
  }
}
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "apple-macos": {
      "command": "node",
      "args": ["/path/to/apple-macos-mcp/dist/index.js"]
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "apple-macos": {
      "command": "node",
      "args": ["/path/to/apple-macos-mcp/dist/index.js"]
    }
  }
}
```

## Permissions

On first use, macOS will prompt you to grant **Automation** access for Notes, Calendar, and Reminders. Click **Allow** for each. If you accidentally deny it, go to **System Settings > Privacy & Security > Automation** and re-enable it.

## Development

```bash
npm install
npm run build
npm run dev
```

## Architecture

```
src/
├── applescript.ts   # Notes AppleScript layer (osascript wrapper)
├── calendar.ts      # Calendar AppleScript layer
├── reminders.ts     # Reminders AppleScript layer
└── index.ts         # MCP server — registers all 22 tools with Zod schemas
```

Each `*.ts` module exports typed async functions that execute AppleScript via `child_process.execFile("osascript", ...)`. The main `index.ts` wires everything into the MCP server using `@modelcontextprotocol/sdk`.

## Date Format

AppleScript uses your **system locale** for date parsing. Use natural language that matches your Mac's locale:

- US: `"April 26, 2026 2:00 PM"`
- UK: `"26 April 2026 14:00"`

When in doubt, match what you see in macOS Terminal when you type `date`.

## Limitations

- **macOS only** — relies on AppleScript and native apps.
- **No recurring event creation** — AppleScript doesn't support recurrence rules directly.
- **No attachments** — limited to text content in notes.
- **AppleScript performance** — operations spawn `osascript` processes; large collections may be slow.

## License

MIT
