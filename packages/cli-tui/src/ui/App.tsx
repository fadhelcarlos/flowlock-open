import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Sidebar } from './Sidebar';
import { Main } from './Main';
import { InputBar } from './InputBar';
import { Palette } from './Palette';
import { useStore } from '../util/store';
import { loadSettings } from '../util/settings';
import { Shortcuts } from './Shortcuts';

export type View = 'home' | 'inventory' | 'audit' | 'diagrams' | 'export' | 'agent' | 'artifacts' | 'settings';

export function App() {
  const [view, setView] = useState<View>('home');
  const setPaletteOpen = useStore(s => s.setPaletteOpen);
  const setSettings = useStore(s => s.setSettings);

  useInput((input, key) => {
    if (key.ctrl && input.toLowerCase() === 'k') {
      setPaletteOpen(true);
    }
    if (input === '\t') {
      useStore.getState().cycleFocus();
    }
  });

  useEffect(() => { 
    (async () => setSettings(await loadSettings()))(); 
  }, [setSettings]);

  return (
    <Box flexDirection="column" height={process.stdout.rows || 40}>
      <Shortcuts />
      <Palette />
      <Box flexGrow={1}>
        <Box width={26} borderStyle="round">
          <Sidebar view={view} onChange={setView} />
        </Box>
        <Box flexGrow={1} marginLeft={1}>
          <Main view={view} />
        </Box>
      </Box>
      <InputBar />
      <Box>
        <Text color="gray">Press Ctrl+K for palette • Type /help for commands</Text>
      </Box>
    </Box>
  );
}