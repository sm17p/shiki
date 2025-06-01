import { act } from "react";

export const DAYS_OF_WEEK: DaysOfWeek[] = [
  { id: 0, code: "S", shortName: "Sun", longName: "Sunday", active: false },
  { id: 1, code: "M", shortName: "Mon", longName: "Monday", active: false },
  { id: 2, code: "T", shortName: "Tue", longName: "Tuesday", active: false },
  { id: 3, code: "W", shortName: "Wed", longName: "Wednesday", active: false },
  { id: 4, code: "T", shortName: "Thu", longName: "Thursday", active: false }, // Note: Both Tue and Thu will have 'T' as code
  { id: 5, code: "F", shortName: "Fri", longName: "Friday", active: false },
  { id: 6, code: "S", shortName: "Sat", longName: "Saturday" },
];

export const STORE_DEFAULTS = {
  days: DAYS_OF_WEEK,
  schedule: [],
  folders: [],
}