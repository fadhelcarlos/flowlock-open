import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import type { View } from './App';

const items = [
  { label: 'Home', value: 'home' },
  { label: 'Inventory', value: 'inventory' },
  { label: 'Audit', value: 'audit' },
  { label: 'Diagrams', value: 'diagrams' },
  { label: 'Export', value: 'export' },
  { label: 'Agent', value: 'agent' },
  { label: 'Artifacts', value: 'artifacts' },
  { label: 'Settings', value: 'settings' }
];

export function Sidebar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text color="cyanBright">FlowLock</Text>
      <SelectInput 
        items={items} 
        initialIndex={items.findIndex(i => i.value === view)} 
        onSelect={i => onChange(i.value as View)} 
      />
    </Box>
  );
}