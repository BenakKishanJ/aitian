/**
 * Attendance utilities for date-based session management
 */

import { Timestamp } from 'firebase/firestore';
import { AttendanceSession } from '@/types';

/**
 * Generate a session name based on date
 * Format: "Jan 15, 2025" or custom name
 */
export function generateSessionName(date: Date, customName?: string): string {
  if (customName && customName.trim()) {
    return customName.trim();
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date for display
 */
export function formatDate(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get month and year for grouping
 */
export function getMonthYear(date: Date | Timestamp): { month: string; year: number; key: string } {
  const d = date instanceof Timestamp ? date.toDate() : date;
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const year = d.getFullYear();
  return {
    month,
    year,
    key: `${month} ${year}`,
  };
}

/**
 * Group sessions by month
 */
export function groupSessionsByMonth<T extends { date: Date | Timestamp }>(
  sessions: T[]
): { [key: string]: { month: string; year: number; sessions: T[] } } {
  const grouped: { [key: string]: { month: string; year: number; sessions: T[] } } = {};

  sessions.forEach((session) => {
    const { key, month, year } = getMonthYear(session.date);
    
    if (!grouped[key]) {
      grouped[key] = { month, year, sessions: [] };
    }
    
    grouped[key].sessions.push(session);
  });

  // Sort sessions within each month by date (newest first)
  Object.keys(grouped).forEach((key) => {
    grouped[key].sessions.sort((a, b) => {
      const dateA = a.date instanceof Timestamp ? a.date.toDate() : a.date;
      const dateB = b.date instanceof Timestamp ? b.date.toDate() : b.date;
      return dateB.getTime() - dateA.getTime();
    });
  });

  return grouped;
}

/**
 * Sort month keys chronologically (newest first)
 */
export function sortMonthKeys(keys: string[]): string[] {
  const monthOrder: { [key: string]: number } = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11,
  };

  return keys.sort((a, b) => {
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    
    const yearDiff = parseInt(yearB) - parseInt(yearA);
    if (yearDiff !== 0) return yearDiff;
    
    return monthOrder[monthB] - monthOrder[monthA];
  });
}

/**
 * Calculate attendance statistics
 */
export function calculateAttendanceStats(
  totalSessions: number,
  attendedSessions: number
): { percentage: number; status: 'good' | 'warning' | 'critical' } {
  if (totalSessions === 0) {
    return { percentage: 0, status: 'good' };
  }

  const percentage = Math.round((attendedSessions / totalSessions) * 100);
  
  let status: 'good' | 'warning' | 'critical' = 'good';
  if (percentage < 60) {
    status = 'critical';
  } else if (percentage < 75) {
    status = 'warning';
  }

  return { percentage, status };
}

/**
 * Get attendance status color
 */
export function getAttendanceStatusColor(status: 'good' | 'warning' | 'critical'): string {
  switch (status) {
    case 'good':
      return '#5AA578';
    case 'warning':
      return '#F9CD61';
    case 'critical':
      return '#F96857';
    default:
      return '#77867D';
  }
}

/**
 * Check if a session is editable (within 24 hours of creation)
 */
export function isSessionEditable(sessionDate: Date | Timestamp): boolean {
  const sessionTime = sessionDate instanceof Timestamp ? sessionDate.toDate() : sessionDate;
  const now = new Date();
  const diffInHours = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
  
  // Allow editing within 24 hours
  return diffInHours <= 24;
}

/**
 * Get today's date string
 */
export function getTodayString(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | Timestamp, date2: Date | Timestamp): boolean {
  const d1 = date1 instanceof Timestamp ? date1.toDate() : date1;
  const d2 = date2 instanceof Timestamp ? date2.toDate() : date2;
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default {
  generateSessionName,
  formatDate,
  formatTime,
  getMonthYear,
  groupSessionsByMonth,
  sortMonthKeys,
  calculateAttendanceStats,
  getAttendanceStatusColor,
  isSessionEditable,
  getTodayString,
  isSameDay,
};
