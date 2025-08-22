import React from 'react';
import { useInput } from 'ink';
import { useStore } from '../util/store.js';

export function Shortcuts() {
  const cancel = useStore(s => s.cancelCurrent);
  
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      void cancel();
    }
  });
  
  return null;
}