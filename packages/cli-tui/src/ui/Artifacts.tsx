import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import open from 'open';
import { useStore } from '../util/store';

export function Artifacts() {
  const artifacts = useStore(s => s.current.artifacts);
  const filter = useStore(s => s.filter);
  const [selected, setSelected] = useState<string | null>(null);
  
  const list = useMemo(() => 
    artifacts.filter(p => p.toLowerCase().includes(filter.toLowerCase())), 
    [artifacts, filter]
  );
  
  const items = list.map(p => ({ label: p, value: p }));

  useInput((input, key) => {
    if (key.return && selected) { 
      void open(selected); 
    }
  });

  return (
    <Box flexDirection="column">
      <Text>Artifacts ({list.length}) — type to filter; Enter to open</Text>
      <SelectInput 
        items={items} 
        onSelect={(i) => setSelected(i.value as string)} 
      />
    </Box>
  );
}