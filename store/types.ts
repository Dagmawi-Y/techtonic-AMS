export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin";
  //| 'teacher' | 'student';
  createdAt: number;
  lastLoginAt: number;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  duration: number;
  createdAt: number;
  updatedAt: number;
}

export interface Batch {
  id: string;
  programId: string;
  name: string;
  startDate: number;
  endDate: number;
  // teacherId: string;
  status: "active" | "completed" | "upcoming";
  createdAt: number;
  updatedAt: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  batchIds: string[];
  enrollmentDate: number;
  status: "active" | "inactive";
  createdAt: number;
  updatedAt: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  batchId: string;
  date: number;
  status: "present" | "absent" | "late";
  markedBy: string;
  markedAt: number;
  updatedAt: number;
}

export interface Report {
  id: string;
  type: "attendance" | "performance";
  batchId: string;
  startDate: number;
  endDate: number;
  data: any;
  generatedBy: string;
  generatedAt: number;
}
