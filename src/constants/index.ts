export type DayOfWeek = {
  id: number;
  code: string;
  longName: string;
  shortName: string;
};

export type ScheduleSettings = {
  enabled: boolean;
  days: number[];
  hour: number;
  minute: number;
  unlock: boolean;
};

export const DAYS_OF_WEEK: DayOfWeek[] = [
  { id: 0, code: "Su", shortName: "Sun", longName: "Sunday" },
  { id: 1, code: "Mo", shortName: "Mon", longName: "Monday" },
  { id: 2, code: "Tu", shortName: "Tue", longName: "Tuesday" },
  { id: 3, code: "We", shortName: "Wed", longName: "Wednesday" },
  { id: 4, code: "Th", shortName: "Thu", longName: "Thursday" },
  { id: 5, code: "Fr", shortName: "Fri", longName: "Friday" },
  { id: 6, code: "Sa", shortName: "Sat", longName: "Saturday" },
];

export const DEFAULT_SCHEDULE: ScheduleSettings = {
  enabled: false,
  days: DAYS_OF_WEEK.map((day) => day.id),
  hour: 1,
  minute: 0,
  unlock: true,
};
