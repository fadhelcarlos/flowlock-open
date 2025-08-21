import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../util/store';
import { Artifacts } from './Artifacts';
import { SettingsView } from './Settings';

export function Main({ view }: { view: string }) {
  const { logs, summary } = useStore(state => ({
    logs: state.current.logs,
    summary: state.current.summary
  }));
  
  return (
    <Box flexDirection="column">
      {view === 'home' && (
        <Text>Welcome. Press Ctrl+K for the palette or type /commands below.</Text>
      )}
      {view === 'artifacts' && <Artifacts />}
      {view === 'settings' && <SettingsView />}
      {view !== 'home' && view !== 'artifacts' && view !== 'settings' && (
        <>
          <Text color="gray">View: {view}</Text>
          {summary && (
            <Box marginY={1}>
              <Text>{summary}</Text>
            </Box>
          )}
          <Box flexDirection="column" marginTop={1}>
            {logs.slice(-500).map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}