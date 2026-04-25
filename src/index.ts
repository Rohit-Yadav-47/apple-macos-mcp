import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as notes from "./applescript.js";

const server = new McpServer({
  name: "apple-notes",
  version: "1.0.0",
});

server.tool("list-folders", "List all folders in Apple Notes", async () => {
  const folders = await notes.listFolders();
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(folders, null, 2),
      },
    ],
  };
});

server.tool(
  "list-notes",
  "List notes in Apple Notes, optionally filtered by folder",
  {
    folder: z
      .string()
      .optional()
      .describe("Folder name to filter by. If omitted, lists all notes."),
  },
  async ({ folder }) => {
    const noteList = await notes.listNotes(folder);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(noteList, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "get-note",
  "Get the content of a specific note by its ID",
  {
    id: z.string().describe("The note ID"),
    format: z
      .enum(["html", "text"])
      .optional()
      .default("text")
      .describe("Return format: 'html' for rich content, 'text' for plain text"),
  },
  async ({ id, format }) => {
    const content =
      format === "html"
        ? await notes.getNote(id)
        : await notes.getNotePlainText(id);
    return {
      content: [{ type: "text", text: content }],
    };
  }
);

server.tool(
  "create-note",
  "Create a new note in Apple Notes",
  {
    name: z.string().describe("Title of the note"),
    body: z.string().describe("Body content of the note (HTML supported)"),
    folder: z
      .string()
      .optional()
      .describe("Folder to create the note in. Defaults to the default folder."),
  },
  async ({ name, body, folder }) => {
    const id = await notes.createNote(name, body, folder);
    return {
      content: [
        {
          type: "text",
          text: `Note created successfully with ID: ${id}`,
        },
      ],
    };
  }
);

server.tool(
  "update-note",
  "Update an existing note's title and/or body",
  {
    id: z.string().describe("The note ID to update"),
    name: z
      .string()
      .optional()
      .describe("New title for the note"),
    body: z
      .string()
      .optional()
      .describe("New body content for the note (HTML supported)"),
  },
  async ({ id, name, body }) => {
    await notes.updateNote(id, { name, body });
    return {
      content: [
        {
          type: "text",
          text: `Note ${id} updated successfully`,
        },
      ],
    };
  }
);

server.tool(
  "delete-note",
  "Delete a note by its ID",
  {
    id: z.string().describe("The note ID to delete"),
  },
  async ({ id }) => {
    await notes.deleteNote(id);
    return {
      content: [
        {
          type: "text",
          text: `Note ${id} deleted successfully`,
        },
      ],
    };
  }
);

server.tool(
  "search-notes",
  "Search notes by text content",
  {
    query: z.string().describe("Search query to find in note content"),
  },
  async ({ query }) => {
    const results = await notes.searchNotes(query);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "move-note",
  "Move a note to a different folder",
  {
    id: z.string().describe("The note ID to move"),
    folder: z.string().describe("Target folder name"),
  },
  async ({ id, folder }) => {
    await notes.moveNote(id, folder);
    return {
      content: [
        {
          type: "text",
          text: `Note ${id} moved to folder "${folder}"`,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
