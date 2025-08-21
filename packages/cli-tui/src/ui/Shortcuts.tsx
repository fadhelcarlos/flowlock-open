import React from 'react';
import { useInput } from 'ink';
import { useStore } from '../util/store';

export function Shortcuts() {
  const cancel = useStore(s => s.cancelCurrent);
  
  useInput((_input, key) => {
    if (key.ctrl && key.shift && key.input === 'C') {
      void cancel();
    }
  });
  
  return null;
}