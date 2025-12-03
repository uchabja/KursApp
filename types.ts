export type PeriodType = 'weekly' | 'monthly' | 'yearly';

export interface Course {
  id: string;
  name: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  fee: number;
  period: PeriodType;
  scheduleDays: string[]; // e.g., ["Monday", "Wednesday"]
  scheduleTime: string; // e.g., "14:00"
  notes: string;
}

export interface Enrollment {
  courseId: string;
  joinDate: string; // ISO Date string
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phone: string; // Can be empty if "no phone" is selected
  dob: string; // Date of birth YYYY-MM-DD

  // Updated Parent Details
  motherName?: string;
  motherPhone?: string;
  fatherName?: string;
  fatherPhone?: string;

  notes?: string;
  status?: 'active' | 'passive' | 'prereg';
  enrollments: Enrollment[];
}

export type PaymentStatus = 'pending' | 'paid' | 'waived' | 'overdue';

export interface Payment {
  id: string;
  studentId: string;
  courseId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  paidDate?: string;
}

export interface AppData {
  students: Student[];
  courses: Course[];
  payments: Payment[];
}
