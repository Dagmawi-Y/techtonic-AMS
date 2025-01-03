import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./storage";
import { Batch } from "./types";

interface BatchState {
  batches: Record<string, Batch>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setBatches: (batches: Record<string, Batch>) => void;
  addBatch: (batch: Batch) => void;
  updateBatch: (batchId: string, updates: Partial<Batch>) => void;
  deleteBatch: (batchId: string) => void;
  getBatchesByProgram: (programId: string) => Batch[];
  getActiveBatches: () => Batch[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBatchStore = create<BatchState>()(
  persist(
    (set, get) => ({
      batches: {},
      isLoading: false,
      error: null,

      setBatches: (batches) => set({ batches }),
      addBatch: (batch) =>
        set((state) => ({
          batches: { ...state.batches, [batch.id]: batch },
        })),
      updateBatch: (batchId, updates) =>
        set((state) => ({
          batches: {
            ...state.batches,
            [batchId]: { ...state.batches[batchId], ...updates },
          },
        })),
      deleteBatch: (batchId) =>
        set((state) => {
          const { [batchId]: _, ...rest } = state.batches;
          return { batches: rest };
        }),
      getBatchesByProgram: (programId) => {
        const state = get();
        return Object.values(state.batches).filter(
          (batch) => batch.programId === programId,
        );
      },
      getActiveBatches: () => {
        const state = get();
        return Object.values(state.batches).filter(
          (batch) => batch.status === "active",
        );
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: "batch-storage",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
