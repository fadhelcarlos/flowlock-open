import { create } from 'zustand';
import type { Settings } from './settings.js';

interface Job { 
  id: string; 
  cmd: string; 
  args: any; 
  status: 'idle' | 'running' | 'done' | 'error'; 
  code?: number; 
}

interface Current { 
  logs: string[]; 
  artifacts: string[]; 
  summary?: string; 
}

interface StoreState {
  paletteOpen: boolean;
  current: Current;
  history: Job[];
  filter: string;
  settings?: Settings;
  setSettings: (s: Settings) => void;
  setPaletteOpen: (v: boolean) => void;
  pushLog: (line: string) => void;
  addArtifacts: (paths: string[]) => void;
  setFilter: (q: string) => void;
  cycleFocus: () => void;
  cancelCurrent: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  paletteOpen: false,
  current: { logs: [], artifacts: [] },
  history: [],
  filter: '',
  setSettings: (s) => set({ settings: s }),
  setPaletteOpen: (v) => set({ paletteOpen: v }),
  pushLog: (line) => set(s => ({ 
    current: { 
      ...s.current, 
      logs: [...s.current.logs, line] 
    }
  })),
  addArtifacts: (paths) => set(s => ({ 
    current: { 
      ...s.current, 
      artifacts: [...new Set([...s.current.artifacts, ...paths])] 
    }
  })),
  setFilter: (q) => set({ filter: q }),
  cycleFocus: () => {},
  cancelCurrent: async () => { 
    /* hook up to AbortController in runCommandById if desired */ 
  }
}));