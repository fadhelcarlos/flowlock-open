# Fix NPM Installation Issue for @flowlock/cli-tui

The package is successfully published (visible at https://www.npmjs.com/package/@flowlock/cli-tui) but npm's CDN hasn't fully synchronized. Here are solutions:

## Solution 1: Wait for CDN Sync (5-10 minutes)
NPM's CDN can take up to 10 minutes to fully propagate. Try again in a few minutes:
```bash
npm install -g @flowlock/cli-tui
```

## Solution 2: Use Direct Registry URL
```bash
npm install -g @flowlock/cli-tui --registry https://registry.npmjs.org/
```

## Solution 3: Install Specific Version
```bash
npm install -g @flowlock/cli-tui@0.10.0
```

## Solution 4: Use Different Registry Mirror
```bash
# Try Yarn's registry
npm install -g @flowlock/cli-tui --registry https://registry.yarnpkg.com/

# Or use Cloudflare's mirror
npm install -g @flowlock/cli-tui --registry https://r.cnpmjs.org/
```

## Solution 5: Clear Everything and Retry
```bash
# Clear npm cache
npm cache clean --force

# Clear node modules globally
npm ls -g --depth=0

# Update npm itself
npm install -g npm@latest

# Try installation again
npm install -g @flowlock/cli-tui
```

## Solution 6: Install from Tarball URL
Since the package is visible on npm website, you can install directly from tarball:
```bash
npm install -g https://registry.npmjs.org/@flowlock/cli-tui/-/cli-tui-0.10.0.tgz
```

## Solution 7: Local Installation for Testing
While waiting for CDN sync, test locally:
```bash
cd packages/cli-tui
npm link
flowlock --help
```

## Alternative: Install the CLI Package Instead
The traditional CLI is also available and working:
```bash
npm install -g flowlock-uxcg
uxcg --help
```

## Why This Happens
- NPM uses a CDN (Content Delivery Network) to distribute packages globally
- When you publish a scoped package (@flowlock/cli-tui), it needs to propagate to all CDN nodes
- The web interface (npmjs.com) updates immediately, but the registry API can lag
- This is especially common with new scoped packages

## Verification
Once it works, verify installation:
```bash
flowlock --version
flowlock --help
flowlock  # Should launch TUI if in terminal
```

The issue should resolve itself within 10-15 minutes as the CDN synchronizes.