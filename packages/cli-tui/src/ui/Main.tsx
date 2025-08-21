import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../util/store.js';
import { Artifacts } from './Artifacts.js';
import { SettingsView } from './Settings.js';

export function Main({ view }: { view: string }) {
  const { logs, summary } = useStore(state => ({
    logs: state.current.logs || [],
    summary: state.current.summary
  }));
  
  return (
    <Box flexDirection="column" height="100%" width="100%">
      {view === 'home' && (
        <Box padding={1}>
          <Text>Welcome. Press Ctrl+K for the palette or type /commands below.</Text>
        </Box>
      )}
      {view === 'artifacts' && <Artifacts />}
      {view === 'settings' && <SettingsView />}
      {view !== 'home' && view !== 'artifacts' && view !== 'settings' && (
        <Box flexDirection="column" height="100%">
          <Box flexShrink={0} paddingX={1} paddingBottom={1}>
            <Text color="cyan" bold>View: {view}</Text>
          </Box>
          {summary && (
            <Box flexShrink={0} paddingX={1} paddingBottom={1}>
              <Text>{summary}</Text>
            </Box>
          )}
          <Box flexGrow={1} flexDirection="column" paddingX={1} overflowY="hidden">
            {logs.slice(-100).map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
            {logs.length === 0 && (
              <Text color="gray">No logs yet. Run a command to see output here.</Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}