import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./storage";
import { Program } from "./types";

interface ProgramState {
  programs: Record<string, Program>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setPrograms: (programs: Record<string, Program>) => void;
  addProgram: (program: Program) => void;
  updateProgram: (programId: string, updates: Partial<Program>) => void;
  deleteProgram: (programId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProgramStore = create<ProgramState>()(
  persist(
    (set, get) => ({
      programs: {},
      isLoading: false,
      error: null,

      setPrograms: (programs) => set({ programs }),
      addProgram: (program) =>
        set((state) => ({
          programs: { ...state.programs, [program.id]: program },
        })),
      updateProgram: (programId, updates) =>
        set((state) => ({
          programs: {
            ...state.programs,
            [programId]: { ...state.programs[programId], ...updates },
          },
        })),
      deleteProgram: (programId) =>
        set((state) => {
          const { [programId]: _, ...rest } = state.programs;
          return { programs: rest };
        }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: "program-storage",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
