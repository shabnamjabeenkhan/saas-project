# Rule: Build Verification After Implementation

## Goal
To ensure that after implementing a feature, all code builds correctly without TypeScript errors, schema issues, or integration problems.

## When to Use
Tag this file in implementation prompts:
- After completing any feature implementation
- Before moving to the testing phase
- When switching between implementation phases
- After merging feature branches

## Build Verification Process

### Step 1: TypeScript Verification
Run this first to catch type errors:
bun run typecheckExpected outcome:
- No TypeScript errors
- React Router types generated in `.react-router/types/**/*`
- Convex types generated in `.convex/_generated/**/*`

**Common fixes:**
- If you see "Cannot find module './+types/[routeName]'" → the typecheck will generate it
- If schema types are missing → run this first before convex dev

### Step 2: Build Verification
Compile the full project:
bun run buildExpected outcome:
- `build/` directory created successfully
- No compilation errors
- Client and server bundles generated

**Common fixes:**
- If you see import errors → check file paths are correct
- If you see circular dependency warnings → refactor the import structure
- If ESM module errors → ensure you're using proper import syntax

### Step 3: Backend (Convex) Verification
For any Convex schema or function changes:
bunx convex dev --onceExpected outcome:
- Schema validates without errors
- Functions can be deployed
- No database migration issues
- Types sync correctly

**Common fixes:**
- If schema validation fails → check `convex/schema.ts` for syntax errors
- If table references fail → ensure table names match in queries
- If field types mismatch → verify v.string(), v.number(), etc. are correct

## Quick Verification Command

Run all three checks in sequence:
bun run typecheck && bun run build && bunx convex dev --onceIf all three pass, you're good to proceed to testing!

## Common Issues & Solutions

### Issue: "Cannot find module './+types/[routeName]'"
**Solution**: This is expected. Run `bun run typecheck` to generate the missing types. The types auto-generate during typecheck.

### Issue: "Property X does not exist on type Y" in Convex
**Solution**: 
1. Check `convex/schema.ts` - ensure the table and field exist
2. Verify spelling matches exactly (case-sensitive)
3. Run `bunx convex dev --once` to validate schema

### Issue: Build fails with import errors
**Solution**:
1. Verify file paths in imports
2. Check file extensions (.ts vs .tsx vs .js)
3. For React Router routes, ensure you're importing from `./+types/[routeName]`

### Issue: Convex schema validation fails
**Solution**:
1. Check for syntax errors in `convex/schema.ts`
2. Ensure all table definitions have proper indexes
3. Verify no circular dependencies between tables
4. Run `bunx convex dev --once` for detailed error messages

## Next Steps After Verification

Once all checks pass:
1. ✅ Update your `feature-[name]-progress.md` with completion status
2. ✅ Mark implementation as "complete" in progress file
3. ✅ Proceed to manual testing (follow your feature plan's testing section)
4. ✅ If errors remain, debug using `@.cursor/commands/debug.md`

## If Verification Fails

1. **Read the error message carefully** - it usually points to the exact problem
2. **Fix the identified issue** (import path, schema field, type error)
3. **Re-run the failing command** to verify the fix
4. **Run all three commands again** to ensure nothing broke in other areas

## Useful Reference

- **Feature Plan**: Describes what you're implementing
- **Progress File**: Tracks what's done vs. what's left
- **This File**: Verifies the implementation compiles correctly
- **Debug Command**: For troubleshooting issues during implementation