import { AppData, Course, Payment, Student } from '../types';

const API_URL = 'http://localhost:3001/api';

const initialData: AppData = {
  students: [],
  courses: [],
  payments: [],
};

export const getData = async (): Promise<AppData> => {
  try {
    const response = await fetch(`${API_URL}/data`);
    if (!response.ok) throw new Error('Failed to fetch data');
    const data = await response.json();

    // Transform dates from strings to what the app expects (if needed)
    // The app mostly uses ISO strings, which JSON returns.
    // However, Prisma returns full ISO strings (2023-01-01T00:00:00.000Z).
    // The app expects YYYY-MM-DD for some fields, but let's see if it handles ISO.
    // Actually, the app uses string for dates in types.ts.

    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return initialData;
  }
};

// NOTE: saveData is no longer used in the same way. 
// We will deprecate it or make it a no-op, as we are moving to granular updates.
export const saveData = (data: AppData) => {
  // No-op: Data is saved via individual API calls now.
  console.warn('saveData called but storage is now handled by API');
};

// --- Helper Logic for Payment Generation (Client-side helper for UI, but actual creation happens on server too) ---
// We keep this for optimistic UI updates or pre-calculation if needed, 
// BUT the server now handles payment generation logic in /enroll and /transfer endpoints.
// We can keep it here if the frontend needs to PREVIEW payments before sending to server.

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const addYears = (date: Date, years: number) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

export const generatePaymentsForEnrollment = (
  studentId: string,
  course: Course,
  joinDateStr: string,
  existingPayments: Payment[]
): Payment[] => {
  const joinDate = new Date(joinDateStr);
  const courseStartDate = new Date(course.startDate);

  let cycleStart = new Date(courseStartDate);

  while (cycleStart <= joinDate) {
    let nextCycle: Date;
    if (course.period === 'weekly') nextCycle = addDays(cycleStart, 7);
    else if (course.period === 'monthly') nextCycle = addMonths(cycleStart, 1);
    else nextCycle = addYears(cycleStart, 1);

    if (nextCycle > joinDate) {
      break;
    }
    cycleStart = nextCycle;
  }

  const newPayments: Payment[] = [];
  let currentPeriodStart = new Date(cycleStart);

  const periodsToGenerate = course.period === 'weekly' ? 52 : (course.period === 'monthly' ? 12 : 5);

  for (let i = 0; i < periodsToGenerate; i++) {
    let periodEnd: Date;
    if (course.period === 'weekly') periodEnd = addDays(currentPeriodStart, 7);
    else if (course.period === 'monthly') periodEnd = addMonths(currentPeriodStart, 1);
    else periodEnd = addYears(currentPeriodStart, 1);

    let effectiveStart = currentPeriodStart < joinDate ? joinDate : currentPeriodStart;

    if (effectiveStart >= periodEnd) {
      currentPeriodStart = periodEnd;
      continue;
    }

    let amount = course.fee;

    if (i === 0 && joinDate > currentPeriodStart) {
      const totalDuration = periodEnd.getTime() - currentPeriodStart.getTime();
      const studentDuration = periodEnd.getTime() - joinDate.getTime();
      const ratio = studentDuration / totalDuration;
      amount = Math.round(course.fee * ratio);
    }

    const exists = existingPayments.some(p =>
      p.studentId === studentId &&
      p.courseId === course.id &&
      p.periodStart.startsWith(effectiveStart.toISOString().split('T')[0])
    );

    if (!exists) {
      newPayments.push({
        id: crypto.randomUUID(),
        studentId,
        courseId: course.id,
        periodStart: effectiveStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        amount,
        status: 'pending',
        dueDate: periodEnd.toISOString().split('T')[0]
      });
    }

    currentPeriodStart = periodEnd;
  }

  return newPayments;
};
