import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { parseSlash } from '../commands/parseSlash';
import { runCommandById } from '../util/runCommand';
import { useStore } from '../util/store';

export function InputBar() {
  const [value, setValue] = useState('');
  const pushLog = useStore(s => s.pushLog);
  
  return (
    <Box borderStyle="round" paddingX={1}>
      <Text color="gray">› </Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={async (v) => {
          if (!v.trim()) return;
          
          if (v.startsWith('/')) {
            const { cmd, flags } = parseSlash(v);
            await runCommandById(cmd, flags, pushLog);
          } else {
            useStore.getState().setFilter(v);
          }
          setValue('');
        }}
        placeholder='Type /inventory, /audit --level strict, "/export --format svg"'
      />
    </Box>
  );
}