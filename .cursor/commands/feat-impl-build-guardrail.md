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

**CRITICAL: Use `bun` for every install, script, or task. No npm/pnpm/yarn.**

### Step 0: Change Verification
**Before running any commands**, review your diff and confirm only the intended files changed:
```bash
git status
git diff
```

### Step 1: Lint Check
Run the repo's lint step to clear every warning/error:
```bash
bun run lint
```
**OR** if lint isn't available, use typecheck:
```bash
bun run typecheck
```

**Expected outcome:**
- No linting errors or warnings
- No TypeScript errors
- React Router types generated in `.react-router/types/**/*`
- Convex types generated in `.convex/_generated/**/*`

**Common fixes:**
- If you see "Cannot find module './+types/[routeName]'" → the typecheck will generate it
- If schema types are missing → run this first before convex dev

### Step 2: Build Verification
Execute build and confirm it succeeds without warnings that require action:
```bash
bun run build
```

**Expected outcome:**
- `build/` directory created successfully
- No compilation errors
- No warnings that require action
- Client and server bundles generated

**Common fixes:**
- If you see import errors → check file paths are correct
- If you see circular dependency warnings → refactor the import structure
- If ESM module errors → ensure you're using proper import syntax

### Step 3: Convex Compilation
Execute Convex compilation and ensure there are zero schema/validator/runtime compilation issues:
```bash
bunx convex dev --once
```

**Expected outcome:**
- Schema validates without errors
- Functions can be deployed
- No database migration issues
- Types sync correctly
- Zero schema/validator/runtime compilation issues

**Common fixes:**
- If schema validation fails → check `convex/schema.ts` for syntax errors
- If table references fail → ensure table names match in queries
- If field types mismatch → verify v.string(), v.number(), etc. are correct

### Step 4: Re-verify Git Status
After the commands pass, re-check git status to make sure no unexpected files changed during the process:
```bash
git status
```

**Expected outcome:**
- Only expected files changed (build artifacts, generated types)
- No unexpected modifications

## Quick Verification Command

Run all checks in sequence:
```bash
git status && bun run lint && bun run build && bunx convex dev --once && git status
```

**OR** if lint isn't available:
```bash
git status && bun run typecheck && bun run build && bunx convex dev --once && git status
```

If all checks pass, you're good to proceed to testing!

## MDX File Guidelines

### CRITICAL: The `<` character in MDX files

MDX interprets `<` as the start of a JSX component. This causes build errors like:
- `Unexpected character before name`
- `Unexpected end of file in name`

**Common mistakes:**
- ❌ `Cost reduced to <$1` → MDX sees `<$1` as a broken JSX tag
- ❌ `<5 min response time` → MDX sees `<5` as a broken JSX tag  
- ❌ `<2% error rate` → MDX sees `<2` as a broken JSX tag
- ❌ `if (x < 10)` → In inline code this is fine, but in prose it breaks

**Fixes:**
- ✅ `Cost reduced to under $1`
- ✅ `Under 5 min response time`
- ✅ `Less than 2% error rate`
- ✅ `` `if (x < 10)` `` → Wrap in backticks for code
- ✅ `&lt;5 min` → Use HTML entity (ugly but works)

**Rule:** When writing MDX content, NEVER use bare `<` followed by numbers or `$`. Always use:
- "under", "less than", "below" instead of `<`
- "over", "greater than", "above" instead of `>`
- Or wrap in backticks if it's code: `` `<5` ``

**Before committing any `.mdx` file**, search for `<[0-9]` and `<\$` patterns and fix them:
```bash
grep -r '<[0-9]\|<\$' docs/ --include="*.mdx"
```

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

### Issue: MDX build errors with `<` character
**Solution**:
1. Search for `<[0-9]` and `<\$` patterns in `.mdx` files
2. Replace with "under", "less than", "below" or wrap in backticks
3. Re-run build to verify fix

## If Verification Fails

1. **Read the error message carefully** - it usually points to the exact problem
2. **Fix the identified issue** (import path, schema field, type error, MDX syntax)
3. **Re-run the failing command** to verify the fix
4. **Run all commands again from the failing step onward** to ensure nothing broke in other areas

## Next Steps After Verification

Once all checks pass:
1. ✅ Update your `feature-[name]-progress.md` with completion status
2. ✅ Mark implementation as "complete" in progress file
3. ✅ Proceed to manual testing (follow your feature plan's testing section)
4. ✅ If errors remain, debug using `@.cursor/commands/debug.md`

## Useful Reference

- **Feature Plan**: Describes what you're implementing
- **Progress File**: Tracks what's done vs. what's left
- **This File**: Verifies the implementation compiles correctly
- **Debug Command**: For troubleshooting issues during implementation
