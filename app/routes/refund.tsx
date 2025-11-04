import type { Route } from "./+types/refund";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Refund Policy - TradeBoost AI" },
    { name: "description", content: "Refund Policy for TradeBoost AI" },
  ];
}

export default function Refund() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl font-bold mb-8">TradeBoost Refund Policy</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: October 7, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">No Refunds</h2>
            <p className="mb-4">
              TradeBoost subscriptions are billed monthly in advance and are non-refundable. By subscribing, you acknowledge and agree that:
            </p>
            <ul className="mb-4 list-disc pl-6">
              <li>Payments cover immediate access to AI campaign generation, performance dashboards, and related services.</li>
              <li>We do not offer refunds or credits for partial months, downgrades, unused time, or account inactivity.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cancellations</h2>
            <ul className="mb-4 list-disc pl-6">
              <li>You may cancel your subscription at any time from the billing settings in the dashboard.</li>
              <li>Cancellation stops future charges but does not result in a refund for the current billing cycle.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Exceptional Circumstances</h2>
            <p className="mb-4">
              We may consider refund requests only where required by applicable consumer protection laws. Decisions are at TradeBoost's sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p className="mb-4">
              If you believe you qualify for a statutory refund or have billing questions, please reach out via the in-app support channel until a support email address is published.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}