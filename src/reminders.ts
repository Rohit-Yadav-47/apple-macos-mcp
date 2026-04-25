import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function esc(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function run(script: string): Promise<string> {
  const { stdout } = await execFileAsync("osascript", ["-e", script], {
    timeout: 30000,
  });
  return stdout.trim();
}

export interface ReminderListInfo {
  id: string;
  name: string;
}

export interface ReminderInfo {
  id: string;
  name: string;
  body: string;
  dueDate: string;
  completed: boolean;
  priority: number;
  list: string;
}

export async function lists(): Promise<ReminderListInfo[]> {
  const script = `
tell application "Reminders"
  set output to ""
  repeat with l in lists
    set output to output & id of l & tab & name of l & linefeed
  end repeat
  return output
end tell`;

  const result = await run(script);
  if (!result) return [];

  return result
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      const [id, name] = l.split("\t");
      return { id: id.trim(), name: name.trim() };
    });
}

export async function listReminders(
  listName?: string,
  showCompleted?: boolean
): Promise<ReminderInfo[]> {
  const completedClause = showCompleted ? "" : " whose completed is false";
  const listClause = listName
    ? `list "${esc(listName)}"`
    : "default list";

  const script = `
tell application "Reminders"
  set output to ""
  set theList to ${listClause}
  set reminderList to (every reminder of theList${completedClause})
  repeat with r in reminderList
    set due to ""
    try
      set due to due date of r as text
    end try
    set output to output & id of r & tab & name of r & tab & body of r & tab & due & tab & (completed of r as text) & tab & (priority of r as text) & tab & name of container of r & linefeed
  end repeat
  return output
end tell`;

  const result = await run(script);
  if (!result) return [];

  return result
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      const parts = l.split("\t");
      return {
        id: parts[0]?.trim() ?? "",
        name: parts[1]?.trim() ?? "",
        body: parts[2]?.trim() ?? "",
        dueDate: parts[3]?.trim() ?? "",
        completed: parts[4]?.trim() === "true",
        priority: parseInt(parts[5]?.trim() ?? "0", 10),
        list: parts[6]?.trim() ?? "",
      };
    });
}

export async function createReminder(
  name: string,
  listName?: string,
  dueDate?: string,
  body?: string,
  priority?: number
): Promise<string> {
  const listClause = listName
    ? `list "${esc(listName)}"`
    : "default list";

  let props = `{name:"${esc(name)}"`;
  if (body) props += `, body:"${esc(body)}"`;
  if (priority && priority > 0) props += `, priority:${priority}`;
  props += "}";

  let dueBlock = "";
  if (dueDate) {
    dueBlock = `
  try
    set due date of r to date "${esc(dueDate)}"
  end try`;
  }

  const script = `
tell application "Reminders"
  set theList to ${listClause}
  set r to make new reminder at theList with properties ${props}${dueBlock}
  return id of r
end tell`;

  return run(script);
}

export async function completeReminder(reminderId: string): Promise<void> {
  const script = `
tell application "Reminders"
  set r to reminder id "${esc(reminderId)}"
  set completed of r to true
end tell`;

  await run(script);
}

export async function uncompleteReminder(reminderId: string): Promise<void> {
  const script = `
tell application "Reminders"
  set r to reminder id "${esc(reminderId)}"
  set completed of r to false
end tell`;

  await run(script);
}

export async function deleteReminder(reminderId: string): Promise<void> {
  const script = `
tell application "Reminders"
  set r to reminder id "${esc(reminderId)}"
  delete r
end tell`;

  await run(script);
}

export async function updateReminder(
  reminderId: string,
  updates: { name?: string; body?: string; dueDate?: string; priority?: number }
): Promise<void> {
  const escapedId = esc(reminderId);
  let modifications = "";

  if (updates.name) {
    modifications += `set name of r to "${esc(updates.name)}"\n`;
  }
  if (updates.body) {
    modifications += `set body of r to "${esc(updates.body)}"\n`;
  }
  if (updates.dueDate) {
    modifications += `set due date of r to date "${esc(updates.dueDate)}"\n`;
  }
  if (updates.priority !== undefined) {
    modifications += `set priority of r to ${updates.priority}\n`;
  }

  if (!modifications) return;

  const script = `
tell application "Reminders"
  set r to reminder id "${escapedId}"
  ${modifications}
end tell`;

  await run(script);
}
