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

export interface CalendarInfo {
  id: string;
  name: string;
}

export interface EventInfo {
  id: string;
  summary: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  calendar: string;
}

export async function listCalendars(): Promise<CalendarInfo[]> {
  const script = `
tell application "Calendar"
  set output to ""
  repeat with c in calendars
    set output to output & id of c & tab & name of c & linefeed
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

export async function listEvents(
  calendarName: string,
  fromDate: string,
  toDate: string
): Promise<EventInfo[]> {
  const script = `
tell application "Calendar"
  set output to ""
  set cal to calendar "${esc(calendarName)}"
  set startRange to date "${esc(fromDate)}"
  set endRange to date "${esc(toDate)}"
  set eventList to (every event of cal whose start date >= startRange and start date <= endRange)
  repeat with e in eventList
    set output to output & id of e & tab & summary of e & tab & start date of e & tab & end date of e & tab & location of e & tab & description of e & tab & name of cal & linefeed
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
        summary: parts[1]?.trim() ?? "",
        startDate: parts[2]?.trim() ?? "",
        endDate: parts[3]?.trim() ?? "",
        location: parts[4]?.trim() ?? "",
        description: parts[5]?.trim() ?? "",
        calendar: parts[6]?.trim() ?? "",
      };
    });
}

export async function getEvent(eventId: string): Promise<EventInfo> {
  const script = `
tell application "Calendar"
  set e to event id "${esc(eventId)}"
  return id of e & tab & summary of e & tab & start date of e & tab & end date of e & tab & location of e & tab & description of e & tab & name of calendar of e
end tell`;

  const result = await run(script);
  const parts = result.split("\t");
  return {
    id: parts[0]?.trim() ?? "",
    summary: parts[1]?.trim() ?? "",
    startDate: parts[2]?.trim() ?? "",
    endDate: parts[3]?.trim() ?? "",
    location: parts[4]?.trim() ?? "",
    description: parts[5]?.trim() ?? "",
    calendar: parts[6]?.trim() ?? "",
  };
}

export async function createEvent(
  calendarName: string,
  summary: string,
  startDate: string,
  endDate: string,
  location?: string,
  description?: string
): Promise<string> {
  const locProp = location ? `, location:"${esc(location)}"` : "";
  const descProp = description ? `, description:"${esc(description)}"` : "";

  const script = `
tell application "Calendar"
  set cal to calendar "${esc(calendarName)}"
  set startD to date "${esc(startDate)}"
  set endD to date "${esc(endDate)}"
  set e to make new event at cal with properties {summary:"${esc(summary)}", start date:startD, end date:endD${locProp}${descProp}}
  return id of e
end tell`;

  return run(script);
}

export async function deleteEvent(eventId: string): Promise<void> {
  const script = `
tell application "Calendar"
  set e to event id "${esc(eventId)}"
  delete e
end tell`;

  await run(script);
}

export async function getTodayAgenda(): Promise<EventInfo[]> {
  const script = `
tell application "Calendar"
  set output to ""
  set todayStart to current date
  set hours of todayStart to 0
  set minutes of todayStart to 0
  set seconds of todayStart to 0
  set todayEnd to todayStart + (1 * days)
  repeat with cal in calendars
    set eventList to (every event of cal whose start date >= todayStart and start date < todayEnd)
    repeat with e in eventList
      set output to output & id of e & tab & summary of e & tab & start date of e & tab & end date of e & tab & location of e & tab & description of e & tab & name of cal & linefeed
    end repeat
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
        summary: parts[1]?.trim() ?? "",
        startDate: parts[2]?.trim() ?? "",
        endDate: parts[3]?.trim() ?? "",
        location: parts[4]?.trim() ?? "",
        description: parts[5]?.trim() ?? "",
        calendar: parts[6]?.trim() ?? "",
      };
    });
}
