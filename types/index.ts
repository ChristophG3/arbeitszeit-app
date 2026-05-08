export type Entry = {
  id: string;
  date: string;
  status: string;

  start_time?: string;
  end_time?: string;

  break_minutes?: number;
  actual_minutes?: number;
  overtime_minutes?: number;

  note: string;
};

export type Adjustment = {
  id: string;
  date: string;
  minutes: number;
  reason: string;
};