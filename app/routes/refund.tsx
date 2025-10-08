import type { Route } from "./+types/refund";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Refund Policy - Kaizen" },
    { name: "description", content: "Refund Policy for Kaizen" },
  ];
}

export default function Refund() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Refund Eligibility</h2>
            <p className="mb-4">
              We offer refunds within 30 days of your initial purchase or subscription renewal, provided you meet the conditions outlined in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How to Request a Refund</h2>
            <p className="mb-4">
              To request a refund, please contact our support team at support@kaizen.com with your account details and reason for the refund request.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Processing Time</h2>
            <p className="mb-4">
              Refunds are typically processed within 5-10 business days after approval. The refund will be credited to your original payment method.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Non-Refundable Items</h2>
            <p className="mb-4">
              Certain services or products may be non-refundable, including but not limited to custom development work or services already rendered.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Cancellation</h2>
            <p className="mb-4">
              You may cancel your subscription at any time. Upon cancellation, you will continue to have access to the service until the end of your current billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about our refund policy, please contact us at support@kaizen.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}