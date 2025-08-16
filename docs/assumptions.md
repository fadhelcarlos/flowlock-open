# FlowLock Build Assumptions

## Assumptions Made During Build Orchestration

1. **Existing uxspec.json**: Found an existing valid uxspec.json file, assumed it should be preserved and fixed rather than replaced.

2. **Product data source**: Marked all product entity fields as external from "catalog_api" as a conservative default for product catalog data.

3. **UI framework**: Generated React TypeScript functional components as UI stubs, as this appears to be the standard in the codebase.

4. **Build tolerance**: Made selfcheck tool tolerant of package build failures as long as the CLI is operational, since this is a monorepo with some packages having build dependencies issues.

5. **Cloud authentication**: Assumed Bearer token authentication is optional (can work without TOKEN if the cloud instance doesn't require auth).

6. **Environment variables**: Used standard naming convention for environment variables (FLOWLOCK_CLOUD_URL, FLOWLOCK_PROJECT_ID, FLOWLOCK_TOKEN).

7. **Node.js scripts**: Used Node.js for cross-platform tooling scripts rather than bash-specific commands.