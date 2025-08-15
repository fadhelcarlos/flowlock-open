# Example Application Screens

This folder contains sample React component screens that demonstrate how FlowLock validates UX specifications against actual implementation.

## Sample Screens

- `UserList.tsx` - List view showing users
- `UserDetail.tsx` - Detail view for a single user  
- `CreateUser.tsx` - Form to create a new user

These screens correspond to the screens defined in the `uxspec.json` file at the root of the monorepo.

## How It Works

When you run `pnpm -w uxcg audit`, FlowLock checks that:

1. **Honest Reads**: Screens only read fields that are properly captured or marked as derived/external
2. **Creatable Needs Detail**: Entities with create forms have corresponding detail screens
3. **Reachability**: Success screens can be reached within the configured number of steps

The audit will detect issues like screens reading fields they haven't captured in forms, which is why you see errors in the example - this is intentional to demonstrate the validation!