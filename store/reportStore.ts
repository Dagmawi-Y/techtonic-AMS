import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from './storage';
import { Report } from './types';

interface ReportState {
  reports: Record<string, Report>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setReports: (reports: Record<string, Report>) => void;
  addReport: (report: Report) => void;
  updateReport: (reportId: string, updates: Partial<Report>) => void;
  deleteReport: (reportId: string) => void;
  getReportsByBatch: (batchId: string, type?: Report['type']) => Report[];
  getReportsByDateRange: (startDate: number, endDate: number, type?: Report['type']) => Report[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useReportStore = create<ReportState>()(
  persist(
    (set, get) => ({
      reports: {},
      isLoading: false,
      error: null,

      setReports: (reports) => set({ reports }),
      addReport: (report) => set((state) => ({
        reports: { ...state.reports, [report.id]: report }
      })),
      updateReport: (reportId, updates) => set((state) => ({
        reports: {
          ...state.reports,
          [reportId]: { ...state.reports[reportId], ...updates }
        }
      })),
      deleteReport: (reportId) => set((state) => {
        const { [reportId]: _, ...rest } = state.reports;
        return { reports: rest };
      }),
      getReportsByBatch: (batchId, type) => {
        const state = get();
        return Object.values(state.reports).filter(report => {
          const matchesBatch = report.batchId === batchId;
          if (!matchesBatch) return false;
          if (type && report.type !== type) return false;
          return true;
        });
      },
      getReportsByDateRange: (startDate, endDate, type) => {
        const state = get();
        return Object.values(state.reports).filter(report => {
          const withinRange = report.generatedAt >= startDate && report.generatedAt <= endDate;
          if (!withinRange) return false;
          if (type && report.type !== type) return false;
          return true;
        });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'report-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
); 