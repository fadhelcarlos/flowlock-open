import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';

export function startTUI() {
  const instance = render(<App />);
  process.on('SIGINT', () => {
    instance.unmount();
    process.exit(0);
  });
  return instance.waitUntilExit();
}