import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { parseSlash } from '../commands/parseSlash.js';
import { runCommandById } from '../util/runCommand.js';
import { useStore } from '../util/store.js';

export function InputBar() {
  const [value, setValue] = useState('');
  const pushLog = useStore(s => s.pushLog);
  
  return (
    <Box borderStyle="round" borderColor="gray" paddingX={1} paddingY={0} marginY={0}>
      <Box flexDirection="row" width="100%">
        <Text color="cyan">› </Text>
        <Box flexGrow={1}>
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
      </Box>
    </Box>
  );
}