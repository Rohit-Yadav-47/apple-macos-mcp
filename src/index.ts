import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as notes from "./applescript.js";
import * as calendar from "./calendar.js";
import * as reminders from "./reminders.js";

const server = new McpServer({
  name: "apple-macos",
  version: "1.1.0",
});

// ──────────────────────────────────────────────
// Notes
// ──────────────────────────────────────────────

server.tool("notes-list-folders", "List all folders in Apple Notes", async () => {
  const folders = await notes.listFolders();
  return { content: [{ type: "text", text: JSON.stringify(folders, null, 2) }] };
});

server.tool(
  "notes-list",
  "List notes in Apple Notes, optionally filtered by folder",
  {
    folder: z.string().optional().describe("Folder name to filter by"),
  },
  async ({ folder }) => {
    const list = await notes.listNotes(folder);
    return { content: [{ type: "text", text: JSON.stringify(list, null, 2) }] };
  }
);

server.tool(
  "notes-get",
  "Get the content of a specific note by its ID",
  {
    id: z.string().describe("The note ID"),
    format: z.enum(["html", "text"]).optional().default("text").describe("Return format"),
  },
  async ({ id, format }) => {
    const content = format === "html" ? await notes.getNote(id) : await notes.getNotePlainText(id);
    return { content: [{ type: "text", text: content }] };
  }
);

server.tool(
  "notes-create",
  "Create a new note in Apple Notes",
  {
    name: z.string().describe("Title of the note"),
    body: z.string().describe("Body content (HTML supported)"),
    folder: z.string().optional().describe("Folder to create the note in"),
  },
  async ({ name, body, folder }) => {
    const id = await notes.createNote(name, body, folder);
    return { content: [{ type: "text", text: `Note created with ID: ${id}` }] };
  }
);

server.tool(
  "notes-update",
  "Update an existing note's title and/or body",
  {
    id: z.string().describe("The note ID"),
    name: z.string().optional().describe("New title"),
    body: z.string().optional().describe("New body content"),
  },
  async ({ id, name, body }) => {
    await notes.updateNote(id, { name, body });
    return { content: [{ type: "text", text: `Note ${id} updated` }] };
  }
);

server.tool(
  "notes-delete",
  "Delete a note by its ID",
  { id: z.string().describe("The note ID") },
  async ({ id }) => {
    await notes.deleteNote(id);
    return { content: [{ type: "text", text: `Note ${id} deleted` }] };
  }
);

server.tool(
  "notes-search",
  "Search notes by text content",
  { query: z.string().describe("Search query") },
  async ({ query }) => {
    const results = await notes.searchNotes(query);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "notes-move",
  "Move a note to a different folder",
  {
    id: z.string().describe("The note ID"),
    folder: z.string().describe("Target folder name"),
  },
  async ({ id, folder }) => {
    await notes.moveNote(id, folder);
    return { content: [{ type: "text", text: `Note ${id} moved to "${folder}"` }] };
  }
);

// ──────────────────────────────────────────────
// Calendar
// ──────────────────────────────────────────────

server.tool(
  "calendar-list",
  "List all calendars in Apple Calendar",
  async () => {
    const cals = await calendar.listCalendars();
    return { content: [{ type: "text", text: JSON.stringify(cals, null, 2) }] };
  }
);

server.tool(
  "calendar-today",
  "Get today's agenda across all calendars",
  async () => {
    const events = await calendar.getTodayAgenda();
    return { content: [{ type: "text", text: JSON.stringify(events, null, 2) }] };
  }
);

server.tool(
  "calendar-events",
  "List events in a calendar within a date range",
  {
    calendar: z.string().describe("Calendar name"),
    fromDate: z.string().describe('Start date, e.g. "April 26, 2026 8:00 AM"'),
    toDate: z.string().describe('End date, e.g. "April 26, 2026 11:59 PM"'),
  },
  async ({ calendar: cal, fromDate, toDate }) => {
    const events = await calendar.listEvents(cal, fromDate, toDate);
    return { content: [{ type: "text", text: JSON.stringify(events, null, 2) }] };
  }
);

server.tool(
  "calendar-get-event",
  "Get details of a specific event by ID",
  { id: z.string().describe("The event ID") },
  async ({ id }) => {
    const e = await calendar.getEvent(id);
    return { content: [{ type: "text", text: JSON.stringify(e, null, 2) }] };
  }
);

server.tool(
  "calendar-create-event",
  "Create a new calendar event",
  {
    calendar: z.string().describe("Calendar name"),
    summary: z.string().describe("Event title"),
    startDate: z.string().describe('Start date, e.g. "April 26, 2026 2:00 PM"'),
    endDate: z.string().describe('End date, e.g. "April 26, 2026 3:00 PM"'),
    location: z.string().optional().describe("Event location"),
    description: z.string().optional().describe("Event description"),
  },
  async ({ calendar: cal, summary, startDate, endDate, location, description }) => {
    const id = await calendar.createEvent(cal, summary, startDate, endDate, location, description);
    return { content: [{ type: "text", text: `Event created with ID: ${id}` }] };
  }
);

server.tool(
  "calendar-delete-event",
  "Delete a calendar event by ID",
  { id: z.string().describe("The event ID") },
  async ({ id }) => {
    await calendar.deleteEvent(id);
    return { content: [{ type: "text", text: `Event ${id} deleted` }] };
  }
);

// ──────────────────────────────────────────────
// Reminders
// ──────────────────────────────────────────────

server.tool(
  "reminders-lists",
  "List all reminder lists",
  async () => {
    const lists = await reminders.lists();
    return { content: [{ type: "text", text: JSON.stringify(lists, null, 2) }] };
  }
);

server.tool(
  "reminders-list",
  "List reminders, optionally filtered by list",
  {
    list: z.string().optional().describe("Reminder list name"),
    showCompleted: z.boolean().optional().default(false).describe("Include completed reminders"),
  },
  async ({ list, showCompleted }) => {
    const items = await reminders.listReminders(list, showCompleted);
    return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
  }
);

server.tool(
  "reminders-create",
  "Create a new reminder",
  {
    name: z.string().describe("Reminder title"),
    list: z.string().optional().describe("Target list name"),
    dueDate: z.string().optional().describe('Due date, e.g. "April 28, 2026 9:00 AM"'),
    body: z.string().optional().describe("Reminder notes/body"),
    priority: z.number().optional().describe("Priority (0=none, 1=high, 5=medium, 9=low)"),
  },
  async ({ name, list, dueDate, body, priority }) => {
    const id = await reminders.createReminder(name, list, dueDate, body, priority);
    return { content: [{ type: "text", text: `Reminder created with ID: ${id}` }] };
  }
);

server.tool(
  "reminders-update",
  "Update a reminder's properties",
  {
    id: z.string().describe("The reminder ID"),
    name: z.string().optional().describe("New title"),
    body: z.string().optional().describe("New body/notes"),
    dueDate: z.string().optional().describe("New due date"),
    priority: z.number().optional().describe("New priority"),
  },
  async ({ id, name, body, dueDate, priority }) => {
    await reminders.updateReminder(id, { name, body, dueDate, priority });
    return { content: [{ type: "text", text: `Reminder ${id} updated` }] };
  }
);

server.tool(
  "reminders-complete",
  "Mark a reminder as completed",
  { id: z.string().describe("The reminder ID") },
  async ({ id }) => {
    await reminders.completeReminder(id);
    return { content: [{ type: "text", text: `Reminder ${id} completed` }] };
  }
);

server.tool(
  "reminders-uncomplete",
  "Mark a reminder as incomplete",
  { id: z.string().describe("The reminder ID") },
  async ({ id }) => {
    await reminders.uncompleteReminder(id);
    return { content: [{ type: "text", text: `Reminder ${id} marked incomplete` }] };
  }
);

server.tool(
  "reminders-delete",
  "Delete a reminder",
  { id: z.string().describe("The reminder ID") },
  async ({ id }) => {
    await reminders.deleteReminder(id);
    return { content: [{ type: "text", text: `Reminder ${id} deleted` }] };
  }
);

// ──────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
