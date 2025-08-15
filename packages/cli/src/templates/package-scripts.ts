export const packageScripts = {
  'uxcg:audit': 'uxcg audit',
  'uxcg:diagrams': 'uxcg diagrams',
  'uxcg:watch': 'uxcg watch',
};

export const huskyPreCommit = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run uxcg:audit
`;