import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./storage";
import { AttendanceRecord } from "./types";

interface AttendanceState {
  records: Record<string, AttendanceRecord>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setRecords: (records: Record<string, AttendanceRecord>) => void;
  addRecord: (record: AttendanceRecord) => void;
  updateRecord: (recordId: string, updates: Partial<AttendanceRecord>) => void;
  deleteRecord: (recordId: string) => void;
  getRecordsByBatch: (
    batchId: string,
    startDate?: number,
    endDate?: number,
  ) => AttendanceRecord[];
  getRecordsByStudent: (
    studentId: string,
    startDate?: number,
    endDate?: number,
  ) => AttendanceRecord[];
  getRecordsByDate: (date: number, batchId?: string) => AttendanceRecord[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      records: {},
      isLoading: false,
      error: null,

      setRecords: (records) => set({ records }),
      addRecord: (record) =>
        set((state) => ({
          records: { ...state.records, [record.id]: record },
        })),
      updateRecord: (recordId, updates) =>
        set((state) => ({
          records: {
            ...state.records,
            [recordId]: { ...state.records[recordId], ...updates },
          },
        })),
      deleteRecord: (recordId) =>
        set((state) => {
          const { [recordId]: _, ...rest } = state.records;
          return { records: rest };
        }),
      getRecordsByBatch: (batchId, startDate, endDate) => {
        const state = get();
        return Object.values(state.records).filter((record) => {
          const matchesBatch = record.batchId === batchId;
          if (!matchesBatch) return false;
          if (startDate && record.date < startDate) return false;
          if (endDate && record.date > endDate) return false;
          return true;
        });
      },
      getRecordsByStudent: (studentId, startDate, endDate) => {
        const state = get();
        return Object.values(state.records).filter((record) => {
          const matchesStudent = record.studentId === studentId;
          if (!matchesStudent) return false;
          if (startDate && record.date < startDate) return false;
          if (endDate && record.date > endDate) return false;
          return true;
        });
      },
      getRecordsByDate: (date, batchId) => {
        const state = get();
        const startOfDay = new Date(date).setHours(0, 0, 0, 0);
        const endOfDay = new Date(date).setHours(23, 59, 59, 999);
        return Object.values(state.records).filter((record) => {
          const matchesDate =
            record.date >= startOfDay && record.date <= endOfDay;
          if (!matchesDate) return false;
          if (batchId && record.batchId !== batchId) return false;
          return true;
        });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: "attendance-storage",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
