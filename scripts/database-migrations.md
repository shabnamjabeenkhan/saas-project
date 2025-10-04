# Database Migrations - Safely Evolve Your Schema

**VIDEO LENGTH**: 4:45
**HOOK**: "Your database schema will change. Without proper migrations, you'll break your app or lose data. Let me show you how to evolve your database safely without downtime."

---

[OPENING - 0:00-0:15]
"Every successful app evolves its database schema. But changing schemas in production is risky - you can break your app or lose data.

Convex migrations let you safely evolve your database without downtime. I'm going to show you the complete workflow."

[WHY MIGRATIONS MATTER - 0:15-0:45]
"Schemas evolve naturally:

- Adding new features requires new fields
- Removing deprecated features requires cleanup
- Changing field types for better performance
- Splitting tables as your app grows

Without migrations:
❌ Breaking changes cause downtime
❌ Data loss from bad schema updates
❌ Complex rollback procedures
❌ Fear of touching the database

With migrations:
✅ Zero-downtime schema evolution
✅ Safe rollback procedures
✅ Incremental changes
✅ Confidence in database changes"

[ESSENTIAL READING - 0:45-1:00]
"Before diving in, read these:

- Intro to Migrations (stack.convex.dev/intro-to-migrations)
- Migrating Data with Mutations (stack.convex.dev/migrating-data-with-mutations)

These are comprehensive guides with advanced patterns."

[KAIZEN SETUP - 1:00-1:15]
"Kaizen comes pre-configured with migrations:

- @convex-dev/migrations is installed
- convex/convex.config.ts includes migrations
- convex/migrations.ts has example functions
- Scripts are ready in package.json

Verify setup:
```bash
bun run migrations:status
```"

[THE MIGRATION WORKFLOW - 1:15-3:00]

**Real Example: Adding user roles**

**Step 1: Make schema changes (loosely at first)**
File: `convex/schema.ts`

Before:
```ts
users: defineTable({
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  tokenIdentifier: v.string(),
}).index("by_token", ["tokenIdentifier"])
```

During migration (make optional):
```ts
users: defineTable({
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  tokenIdentifier: v.string(),
  role: v.optional(
    v.union(v.literal("member"), v.literal("admin"))
  ),
}).index("by_token", ["tokenIdentifier"])
```

After migration (make required):
```ts
users: defineTable({
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  tokenIdentifier: v.string(),
  role: v.union(v.literal("member"), v.literal("admin")),
}).index("by_token", ["tokenIdentifier"])
```

**Step 2: Update write paths for new data**
File: `convex/users.ts`

```ts
const userId = await ctx.db.insert("users", {
  name: identity.name,
  email: identity.email,
  tokenIdentifier: identity.subject,
  role: "member", // New field for future users
});
```

**Step 3: Write the migration**
File: `convex/migrations.ts`

```ts
export const setDefaultUserRole = migrations.define({
  table: "users",
  migrateOne: async (ctx, user: any) => {
    if (user.role === undefined) {
      await ctx.db.patch(user._id, { role: "member" });
    }
  },
});
```

**Step 4: Run the migration**
Local development:
```bash
npx convex dev  # Refresh types
bun run migrations:run -- '{"fn":"migrations:setDefaultUserRole"}'
```

Production:
```bash
npx convex deploy --cmd 'bun run build' && \
  npx convex run convex/migrations.ts:run --prod '{"fn":"migrations:setDefaultUserRole"}'
```

**Step 5: Clean up**
- Make field required in schema
- Remove temporary code branches
- Re-deploy"

[MIGRATION PATTERNS - 3:00-3:45]

**Add default field value:**
```ts
export const setDefaultPlan = migrations.define({
  table: "subscriptions",
  migrateOne: async (ctx, doc) => {
    if ((doc as any).plan === undefined) {
      await ctx.db.patch(doc._id, { plan: "basic" });
    }
  },
});
```

**Remove deprecated field:**
```ts
export const removeDeprecatedIsPro = migrations.define({
  table: "subscriptions",
  migrateOne: () => ({ isPro: undefined } as any),
});
```

**Convert field type:**
```ts
export const zipCodeToString = migrations.define({
  table: "users",
  migrateOne: (_ctx, user: any) => {
    if (typeof user.zipCode === "number") {
      return { zipCode: String(user.zipCode) } as any;
    }
  },
});
```

**Migrate subset via index:**
```ts
export const fixMissingRequired = migrations.define({
  table: "users",
  customRange: (q) => q.withIndex("by_token", (x) => x.eq("tokenIdentifier", "")),
  migrateOne: () => ({ tokenIdentifier: "<unknown>" }),
});
```"

[MIGRATION OPERATIONS - 3:45-4:15]

**Run operations:**
```bash
# Run one migration
bun run migrations:run -- '{"fn":"migrations:setDefaultUserRole"}'

# Dry run (test without committing)
bun run migrations:run -- '{"fn":"migrations:setDefaultUserRole","dryRun":true}'

# Watch status
bun run migrations:status

# Cancel running migration
bun run migrations:cancel -- '{"name":"migrations:setDefaultUserRole"}'

# Restart from beginning
bun run migrations:run -- '{"fn":"migrations:setDefaultUserRole","cursor":null}'
```

**Tuning:**
- `batchSize`: Items per batch (default 100)
- `parallelize`: Concurrent processing within batch"

[BEST PRACTICES - 4:15-4:45]
"- Keep migrations idempotent with `if` checks
- Widen schema first, backfill data, then tighten
- Ship small, targeted migrations
- Handle both old/new data shapes during migration window
- Always test with `dryRun` first
- Write app code that works with both schemas temporarily

This workflow lets you evolve your database confidently, without fear of breaking production."

[FROM MVP TO SCALE - 4:45-5:00]
"Start with Kaizen's included schema. As you learn and grow:

- Add features that require new fields
- Split tables as usage patterns emerge
- Optimize with better indexes
- Clean up deprecated fields

The migration system tracks progress, handles failures, and lets you safely change data over time - without downtime.

Your database can now evolve with your product!"

---

**VISUAL NOTES**:
- Schema evolution visualization
- Migration workflow diagram
- Before/after code examples
- Terminal command demonstrations
- Status monitoring interface
- Error handling examples
- Real-world migration scenarios
