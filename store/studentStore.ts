import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from './storage';
import { Student } from './types';

interface StudentState {
  students: Record<string, Student>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setStudents: (students: Record<string, Student>) => void;
  addStudent: (student: Student) => void;
  updateStudent: (studentId: string, updates: Partial<Student>) => void;
  deleteStudent: (studentId: string) => void;
  getStudentsByBatch: (batchId: string) => Student[];
  getActiveStudents: () => Student[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStudentStore = create<StudentState>()(
  persist(
    (set, get) => ({
      students: {},
      isLoading: false,
      error: null,

      setStudents: (students) => set({ students }),
      addStudent: (student) => set((state) => ({
        students: { ...state.students, [student.id]: student }
      })),
      updateStudent: (studentId, updates) => set((state) => ({
        students: {
          ...state.students,
          [studentId]: { ...state.students[studentId], ...updates }
        }
      })),
      deleteStudent: (studentId) => set((state) => {
        const { [studentId]: _, ...rest } = state.students;
        return { students: rest };
      }),
      getStudentsByBatch: (batchId) => {
        const state = get();
        return Object.values(state.students).filter(
          student => student.batchIds.includes(batchId)
        );
      },
      getActiveStudents: () => {
        const state = get();
        return Object.values(state.students).filter(
          student => student.status === 'active'
        );
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'student-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
); 