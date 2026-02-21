# STATE.md

## Current Position
- **Phase**: 7
- **Task**: Planning complete (revised)
- **Status**: Ready for execution

## Last Session Summary
The user requested a complete restructuring of Phase 7's approach. We overwrote the previous plans to follow a stricter "Backend-First" methodology with rigorous repository tidying:
1. **Plan 7.1**: Strip "Settings" from the Vite frontend, cleanly partition the root repository strictly into `/frontend` and `/backend`, and aggressively update `.gitignore`.
2. **Plan 7.2**: Build the FastAPI abstraction layer *first*, ensuring all simulation, inference, and metric endpoints actually exist and serve correctly typed data.
3. **Plan 7.3**: Finally, wire the React dashboard hooks into the newly-proven `/api/` layer endpoints, replacing the fake `setTimeout` rendering.

## Next Steps
1. /execute 7
