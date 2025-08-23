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

export type FocusPanel = 'sidebar' | 'main' | 'input';

interface StoreState {
  paletteOpen: boolean;
  current: Current;
  history: Job[];
  filter: string;
  settings?: Settings;
  focusedPanel: FocusPanel;
  setSettings: (s: Settings) => void;
  setPaletteOpen: (v: boolean) => void;
  pushLog: (line: string) => void;
  addArtifacts: (paths: string[]) => void;
  setFilter: (q: string) => void;
  cycleFocus: () => void;
  setFocus: (panel: FocusPanel) => void;
  cancelCurrent: () => Promise<void>;
}

export const useStore = create<StoreState>((set, _get) => ({
  paletteOpen: false,
  current: { logs: [], artifacts: [] },
  history: [],
  filter: '',
  focusedPanel: 'input',
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
  cycleFocus: () => set(s => {
    const panels: FocusPanel[] = ['sidebar', 'main', 'input'];
    const currentIndex = panels.indexOf(s.focusedPanel);
    const nextIndex = (currentIndex + 1) % panels.length;
    return { focusedPanel: panels[nextIndex] };
  }),
  setFocus: (panel) => set({ focusedPanel: panel }),
  cancelCurrent: async () => { 
    /* hook up to AbortController in runCommandById if desired */ 
  }
}));