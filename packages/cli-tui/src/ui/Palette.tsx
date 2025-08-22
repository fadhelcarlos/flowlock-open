import React from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Fuse from 'fuse.js';
import { commands } from '../commands/registry.js';
import { useStore } from '../util/store.js';
import { runCommandById } from '../util/runCommand.js';

const fuse = new Fuse(commands, { 
  keys: ['id', 'title', 'category'], 
  threshold: 0.4 
});

export function Palette() {
  const paletteOpen = useStore(s => s.paletteOpen);
  const setPaletteOpen = useStore(s => s.setPaletteOpen);
  const [q, setQ] = React.useState('');
  const [idx, setIdx] = React.useState(0);
  const results = q ? fuse.search(q).map(r => r.item) : commands;

  useInput((input, key) => {
    if (!paletteOpen) return;
    
    if (key.escape) {
      setPaletteOpen(false);
    }
    if (key.downArrow) {
      setIdx(i => Math.min(i + 1, results.length - 1));
    }
    if (key.upArrow) {
      setIdx(i => Math.max(i - 1, 0));
    }
    if (key.return) {
      const c = results[idx]; 
      setPaletteOpen(false);
      void runCommandById(c.id, {}, useStore.getState().pushLog);
    }
  });

  if (!paletteOpen) return null;
  
  return (
    <Box 
      flexDirection="column" 
      borderStyle="round" 
      borderColor="cyan" 
      padding={1}
    >
      <Text color="cyan" bold>Command Palette</Text>
      <TextInput value={q} onChange={setQ} placeholder="Type a command…" />
      <Box flexDirection="column" marginTop={1}>
        {results.slice(0, 10).map((c, i) => (
          <Text key={c.id} inverse={i === idx}>
            {c.title}  <Text color="gray">/{c.id}</Text>
          </Text>
        ))}
      </Box>
    </Box>
  );
}