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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
