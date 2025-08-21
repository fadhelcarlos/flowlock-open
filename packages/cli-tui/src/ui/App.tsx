import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Sidebar } from './Sidebar.js';
import { Main } from './Main.js';
import { InputBar } from './InputBar.js';
import { Palette } from './Palette.js';
import { useStore } from '../util/store.js';
import { loadSettings } from '../util/settings.js';
import { Shortcuts } from './Shortcuts.js';
import { scanArtifacts } from '../util/scanArtifacts.js';

export type View = 'home' | 'inventory' | 'audit' | 'diagrams' | 'export' | 'agent' | 'artifacts' | 'settings';

export function App() {
  const [view, setView] = useState<View>('home');
  const setPaletteOpen = useStore(s => s.setPaletteOpen);
  const setSettings = useStore(s => s.setSettings);
  const addArtifacts = useStore(s => s.addArtifacts);

  useInput((input, key) => {
    if (key.ctrl && input.toLowerCase() === 'k') {
      setPaletteOpen(true);
    }
    if (input === '\t') {
      useStore.getState().cycleFocus();
    }
  });

  useEffect(() => { 
    (async () => {
      setSettings(await loadSettings());
      const artifacts = await scanArtifacts();
      addArtifacts(artifacts);
    })(); 
  }, [setSettings, addArtifacts]);

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Shortcuts />
      <Palette />
      <Box flexGrow={1} flexDirection="row">
        <Box width={26} flexShrink={0} borderStyle="round" borderColor="gray">
          <Sidebar view={view} onChange={setView} />
        </Box>
        <Box flexGrow={1} marginLeft={1} minWidth={0}>
          <Main view={view} />
        </Box>
      </Box>
      <Box flexShrink={0}>
        <InputBar />
      </Box>
      <Box flexShrink={0} paddingX={1}>
        <Text color="gray">Press Ctrl+K for palette • Type /help for commands</Text>
      </Box>
    </Box>
  );
}