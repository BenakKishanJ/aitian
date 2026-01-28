export interface DayInfo {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export interface WeekInfo {
  weekNumber: number;
  days: DayInfo[];
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Get the first day of the month (0 = Sunday, 6 = Saturday)
 */
export function getFirstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

/**
 * Get calendar grid for a month (including padding days from prev/next month)
 */
export function getMonthCalendarGrid(date: Date): WeekInfo[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = getFirstDayOfMonth(date);
  const daysInMonth = getDaysInMonth(date);
  const daysInPrevMonth = getDaysInMonth(
    new Date(year, month - 1, 1)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weeks: WeekInfo[] = [];
  let currentWeek: DayInfo[] = [];
  let weekNumber = 0;

  // Add days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayDate = new Date(year, month - 1, daysInPrevMonth - i);
    currentWeek.push({
      date: dayDate,
      dayOfMonth: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: dayDate.getTime() === today.getTime(),
      isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
    });
  }

  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    currentWeek.push({
      date: dayDate,
      dayOfMonth: day,
      isCurrentMonth: true,
      isToday: dayDate.getTime() === today.getTime(),
      isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
    });

    // If week is complete, add it to weeks array
    if (currentWeek.length === 7) {
      weeks.push({
        weekNumber: weekNumber++,
        days: currentWeek,
      });
      currentWeek = [];
    }
  }

  // Add days from next month to complete the last week
  if (currentWeek.length > 0) {
    let nextMonthDay = 1;
    while (currentWeek.length < 7) {
      const dayDate = new Date(year, month + 1, nextMonthDay);
      currentWeek.push({
        date: dayDate,
        dayOfMonth: nextMonthDay,
        isCurrentMonth: false,
        isToday: dayDate.getTime() === today.getTime(),
        isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
      });
      nextMonthDay++;
    }
    weeks.push({
      weekNumber: weekNumber,
      days: currentWeek,
    });
  }

  return weeks;
}

/**
 * Get the week containing a specific date
 */
export function getWeekDays(date: Date): DayInfo[] {
  const dayOfWeek = date.getDay();
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays: DayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + i);

    weekDays.push({
      date: dayDate,
      dayOfMonth: dayDate.getDate(),
      isCurrentMonth: dayDate.getMonth() === date.getMonth(),
      isToday: dayDate.getTime() === today.getTime(),
      isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
    });
  }

  return weekDays;
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date, format: 'full' | 'short' | 'month-year' = 'short'): string {
  const options: Intl.DateTimeFormatOptions = {};

  switch (format) {
    case 'full':
      options.weekday = 'long';
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      break;
    case 'month-year':
      options.year = 'numeric';
      options.month = 'long';
      break;
    case 'short':
    default:
      options.month = 'short';
      options.day = 'numeric';
      break;
  }

  return date.toLocaleDateString('en-US', options);
}

/**
 * Format time to readable string
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date range
 */
export function formatDateRange(start: Date, end: Date): string {
  const startDate = formatDate(start, 'short');
  const startTime = formatTime(start);
  const endTime = formatTime(end);

  return `${startDate} • ${startTime} - ${endTime}`;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get start and end of month
 */
export function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get start and end of week
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const dayOfWeek = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Navigate to previous month
 */
export function getPreviousMonth(date: Date): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() - 1);
  return newDate;
}

/**
 * Navigate to next month
 */
export function getNextMonth(date: Date): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + 1);
  return newDate;
}

/**
 * Navigate to previous week
 */
export function getPreviousWeek(date: Date): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - 7);
  return newDate;
}

/**
 * Navigate to next week
 */
export function getNextWeek(date: Date): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 7);
  return newDate;
}

/**
 * Get day name abbreviation
 */
export function getDayAbbreviation(dayIndex: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
}

/**
 * Get full day name
 */
export function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}

/**
 * Get the ISO day code (MON, TUE, etc.)
 */
export function getIsoDayCode(dayIndex: number): string {
  const codes = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return codes[dayIndex];
}

/**
 * Parse ISO day code to day index
 */
export function parseDayCode(code: string): number {
  const codes = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return codes.indexOf(code.toUpperCase());
}
