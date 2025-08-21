import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../util/store.js';
import { saveSettings } from '../util/settings.js';

export function SettingsView() {
  const settings = useStore(s => s.settings);
  const setSettings = useStore(s => s.setSettings);
  const [theme, setTheme] = React.useState(settings?.user?.theme ?? 'dark');

  return (
    <Box flexDirection="column" padding={1}>
      <Box paddingBottom={1}>
        <Text color="cyan" bold>Settings</Text>
      </Box>
      <Box flexDirection="column" paddingY={1}>
        <Box paddingBottom={1}>
          <Text>Theme (dark/light): </Text>
        </Box>
        <TextInput 
          value={theme} 
          onChange={setTheme} 
          onSubmit={async (v) => {
            const next = { 
              ...(settings || {}), 
              user: { 
                ...(settings?.user || {}), 
                theme: v 
              } 
            };
            setSettings(next);
            await saveSettings(next);
          }} 
        />
      </Box>
      <Box paddingTop={2}>
        <Text color="gray">
          Settings persist to ~/.flowlock/state.json and ./.flowlock/state.json
        </Text>
      </Box>
    </Box>
  );
}