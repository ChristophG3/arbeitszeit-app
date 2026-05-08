import { bavarianHolidays } from "@/lib/holidays";

export function calculateMinutes(
  start: string,
  end: string,
  pause: number
) {
  if (!start || !end) return 0;

  const [startHour, startMinute] = start
    .split(":")
    .map(Number);

  const [endHour, endMinute] = end
    .split(":")
    .map(Number);

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;

  return endTotal - startTotal - pause;
}

export function getWorkingDaysInMonth(
  month: string
) {
  const [year, monthIndex] = month
    .split("-")
    .map(Number);

  const daysInMonth = new Date(
    year,
    monthIndex,
    0
  ).getDate();

  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(
      year,
      monthIndex - 1,
      day
    );

    const isoDate = currentDate
      .toISOString()
      .slice(0, 10);

    const weekday = currentDate.getDay();

    const isWeekend =
      weekday === 0 || weekday === 6;

    const isHoliday =
      bavarianHolidays.includes(isoDate);

    if (!isWeekend && !isHoliday) {
      workingDays++;
    }
  }

  return workingDays;
}

export function getWeekendDaysInMonth(
  month: string
) {
  const [year, monthIndex] = month
    .split("-")
    .map(Number);

  const daysInMonth = new Date(
    year,
    monthIndex,
    0
  ).getDate();

  let weekendDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(
      year,
      monthIndex - 1,
      day
    );

    const weekday = currentDate.getDay();

    if (weekday === 0 || weekday === 6) {
      weekendDays++;
    }
  }

  return weekendDays;
}