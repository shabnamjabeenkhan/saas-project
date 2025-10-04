import { Button } from "~/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

export default function ContentSection() {
  return (
    <section id="content" className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-6 md:grid-cols-2 md:gap-12">
          <h2 className="text-4xl font-medium">
            Type-safe, AI-friendly codebase.
          </h2>
          <div className="space-y-6">
            <p>
              Built end-to-end in TypeScript.
            </p>
            <p>
              Every prop, query and mutation is fully typed <em>across</em> the stack. Autocomplete just works and refactors are painless.
            </p>
            <p>
              Powered by <span className="font-bold">Convex</span>, your entire
              backend—database, storage, cron jobs, and auth hooks—is expressed
              as plain code. No YAML, no dashboards, no hidden state.
            </p>

            <p>
              Large-language models can read the source tree and generate new
              backend logic in seconds, giving you accurate scaffolds for any
              use-case without bolting on extra services.
            </p>

            <p>
              <span className="font-bold">One repo, one language.</span> Zero
              third-party glue.
            </p>
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="gap-1 pr-1.5"
            >
              <Link to="https://www.convex.dev/" target="_blank" rel="noopener noreferrer">
                <span>Learn More About Convex</span>
                <ChevronRight className="size-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
