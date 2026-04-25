import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function escapeAppleScript(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function runAppleScript(script: string): Promise<string> {
  const { stdout } = await execFileAsync("osascript", ["-e", script], {
    timeout: 30000,
  });
  return stdout.trim();
}

export interface NoteInfo {
  id: string;
  name: string;
  modificationDate: string;
  creationDate: string;
  folder: string;
}

export interface FolderInfo {
  id: string;
  name: string;
}

export async function listFolders(): Promise<FolderInfo[]> {
  const script = `
tell application "Notes"
  set output to ""
  repeat with f in folders
    set output to output & id of f & tab & name of f & linefeed
  end repeat
  return output
end tell`;

  const result = await runAppleScript(script);
  if (!result) return [];

  return result
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const [id, name] = line.split("\t");
      return { id: id.trim(), name: name.trim() };
    });
}

export async function listNotes(folderName?: string): Promise<NoteInfo[]> {
  const folderClause = folderName
    ? `folder "${escapeAppleScript(folderName)}"`
    : "default account";

  const script = `
tell application "Notes"
  set output to ""
  set noteList to notes of ${folderClause}
  repeat with n in noteList
    set output to output & id of n & tab & name of n & tab & modification date of n & tab & creation date of n & tab & container of n & linefeed
  end repeat
  return output
end tell`;

  const result = await runAppleScript(script);
  if (!result) return [];

  return result
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split("\t");
      return {
        id: parts[0]?.trim() ?? "",
        name: parts[1]?.trim() ?? "",
        modificationDate: parts[2]?.trim() ?? "",
        creationDate: parts[3]?.trim() ?? "",
        folder: parts[4]?.trim() ?? "",
      };
    });
}

export async function getNote(noteId: string): Promise<string> {
  const script = `
tell application "Notes"
  set n to note id "${escapeAppleScript(noteId)}"
  return body of n
end tell`;

  return runAppleScript(script);
}

export async function getNotePlainText(noteId: string): Promise<string> {
  const script = `
tell application "Notes"
  set n to note id "${escapeAppleScript(noteId)}"
  return plaintext of n
end tell`;

  return runAppleScript(script);
}

export async function createNote(
  name: string,
  body: string,
  folderName?: string
): Promise<string> {
  const escapedName = escapeAppleScript(name);
  const escapedBody = escapeAppleScript(body);
  const folderClause = folderName
    ? `folder "${escapeAppleScript(folderName)}"`
    : "default account";

  const script = `
tell application "Notes"
  tell ${folderClause}
    set n to make new note with properties {name:"${escapedName}", body:"${escapedBody}"}
    return id of n
  end tell
end tell`;

  return runAppleScript(script);
}

export async function updateNote(
  noteId: string,
  updates: { name?: string; body?: string }
): Promise<void> {
  const escapedId = escapeAppleScript(noteId);
  let modifications = "";

  if (updates.name) {
    modifications += `set name of n to "${escapeAppleScript(updates.name)}"\n`;
  }
  if (updates.body) {
    modifications += `set body of n to "${escapeAppleScript(updates.body)}"\n`;
  }

  if (!modifications) return;

  const script = `
tell application "Notes"
  set n to note id "${escapedId}"
  ${modifications}
end tell`;

  await runAppleScript(script);
}

export async function deleteNote(noteId: string): Promise<void> {
  const script = `
tell application "Notes"
  set n to note id "${escapeAppleScript(noteId)}"
  delete n
end tell`;

  await runAppleScript(script);
}

export async function searchNotes(query: string): Promise<NoteInfo[]> {
  const script = `
tell application "Notes"
  set output to ""
  set noteList to notes of default account
  repeat with n in noteList
    set noteText to plaintext of n
    if noteText contains "${escapeAppleScript(query)}" then
      set output to output & id of n & tab & name of n & tab & modification date of n & tab & creation date of n & tab & container of n & linefeed
    end if
  end repeat
  return output
end tell`;

  const result = await runAppleScript(script);
  if (!result) return [];

  return result
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split("\t");
      return {
        id: parts[0]?.trim() ?? "",
        name: parts[1]?.trim() ?? "",
        modificationDate: parts[2]?.trim() ?? "",
        creationDate: parts[3]?.trim() ?? "",
        folder: parts[4]?.trim() ?? "",
      };
    });
}

export async function moveNote(
  noteId: string,
  targetFolderName: string
): Promise<void> {
  const script = `
tell application "Notes"
  set n to note id "${escapeAppleScript(noteId)}"
  set targetFolder to folder "${escapeAppleScript(targetFolderName)}"
  move n to targetFolder
end tell`;

  await runAppleScript(script);
}
