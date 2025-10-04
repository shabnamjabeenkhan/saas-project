import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

// Initialize migrations helper with typed DataModel
// Cast to any to avoid typegen timing issues before `npx convex dev` updates types
const componentsAny = components as any;
const internalAny = internal as any;
export const migrations = new Migrations<DataModel>(componentsAny.migrations);

// Generic runner that accepts { fn?: string; next?: string[]; dryRun?: boolean; cursor?: string | null; batchSize?: number }
export const run = migrations.runner();

// Convenience: run a single migration by name from dashboard/CLI
// Example CLI: npx convex run migrations:runIt '{ fn: "migrations:setDefaultUserName", dryRun: true }'
export const runIt = migrations.runner(internalAny.migrations.setDefaultUserName);

// Run a series of migrations, edit list as you add more
export const runAll = migrations.runner([
  internalAny.migrations.setDefaultUserName,
  internalAny.migrations.setDefaultCancelAtPeriodEnd,
  internalAny.migrations.ensureWebhookProcessedFlag,
]);

// Example migrations below — safe and illustrative patterns.

// 1) Users: add a default name if missing
export const setDefaultUserName = migrations.define({
  table: "users",
  migrateOne: async (ctx: any, user: any) => {
    if (user.name === undefined || user.name === "") {
      await ctx.db.patch(user._id, { name: "Anonymous" });
    }
  },
});

// 2) Shorthand: clear a deprecated field on each document
export const setDefaultCancelAtPeriodEnd = migrations.define({
  table: "subscriptions",
  migrateOne: (_ctx: any, sub: any) => {
    if (sub.cancelAtPeriodEnd === undefined) {
      return { cancelAtPeriodEnd: false } as any;
    }
  },
});

// 3) Convert a number zipCode to string
export const ensureWebhookProcessedFlag = migrations.define({
  table: "webhookEvents",
  migrateOne: (_ctx: any, evt: any) => {
    if (evt.processed === undefined) {
      return { processed: false, processingStatus: evt.processingStatus ?? "pending" } as any;
    }
  },
});


