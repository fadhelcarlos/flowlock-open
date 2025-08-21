import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../util/store';
import { saveSettings } from '../util/settings';

export function SettingsView() {
  const settings = useStore(s => s.settings);
  const setSettings = useStore(s => s.setSettings);
  const [theme, setTheme] = React.useState(settings?.user?.theme ?? 'dark');

  return (
    <Box flexDirection="column">
      <Text>Settings</Text>
      <Box>
        <Text>Theme (dark/light): </Text>
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
      <Text color="gray">
        Settings persist to ~/.flowlock/state.json and ./.flowlock/state.json
      </Text>
    </Box>
  );
}