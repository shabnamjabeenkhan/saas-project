import React from "react";
import { Compare } from "~/components/ui/compare";

export function ConvexComparison() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Convex vs Supabase?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            See the difference in developer experience, type safety, and real-time capabilities
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Comparison 1: Type Safety & Developer Experience */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Type Safety & Developer Experience
            </h3>
            <div className="p-4 border rounded-3xl dark:bg-neutral-900 bg-neutral-100 border-neutral-200 dark:border-neutral-800">
              <Compare
                firstImage="/comparisons/supabase-types.png"
                secondImage="/comparisons/convex-types.png"
                firstImageClassName="object-cover object-left-top"
                secondImageClassname="object-cover object-left-top"
                className="h-[300px] w-full"
                slideMode="hover"
              />
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Convex auto-generates types on save with full intellisense, while Supabase requires manual CLI commands
              </p>
            </div>
          </div>

          {/* Comparison 2: Real-time Updates */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Real-time Updates
            </h3>
            <div className="p-4 border rounded-3xl dark:bg-neutral-900 bg-neutral-100 border-neutral-200 dark:border-neutral-800">
              <Compare
                firstImage="/comparisons/supabase-real-time.png"
                secondImage="/comparisons/convex-real-time.png"
                firstImageClassName="object-cover object-left-top"
                secondImageClassname="object-cover object-left-top"
                className="h-[300px] w-full"
                slideMode="hover"
              />
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Convex provides automatic real-time updates with zero subscription setup, unlike Supabase's complex manual subscriptions
              </p>
            </div>
          </div>

          {/* Comparison 3: Security & Authorization */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Security & Authorization
            </h3>
            <div className="p-4 border rounded-3xl dark:bg-neutral-900 bg-neutral-100 border-neutral-200 dark:border-neutral-800">
              <Compare
                firstImage="/comparisons/supabase-security.png"
                secondImage="/comparisons/convex-security.png"
                firstImageClassName="object-cover object-left-top"
                secondImageClassname="object-cover object-left-top"
                className="h-[300px] w-full"
                slideMode="hover"
              />
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Convex keeps business logic in TypeScript, while Supabase forces you to write complex SQL policies
              </p>
            </div>
          </div>

          {/* Comparison 4: Functions & Business Logic */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Functions & Business Logic
            </h3>
            <div className="p-4 border rounded-3xl dark:bg-neutral-900 bg-neutral-100 border-neutral-200 dark:border-neutral-800">
              <Compare
                firstImage="/comparisons/supabase-functions.png"
                secondImage="/comparisons/convex-functions.png"
                firstImageClassName="object-cover object-left-top"
                secondImageClassname="object-cover object-left-top"
                className="h-[300px] w-full"
                slideMode="hover"
              />
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Convex offers TypeScript functions with built-in transactions, while Supabase uses Deno with no transaction support
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 