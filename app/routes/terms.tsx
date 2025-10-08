import type { Route } from "./+types/terms";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Terms of Service - Kaizen" },
    { name: "description", content: "Terms of Service for Kaizen" },
  ];
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using Kaizen's services, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p className="mb-4">
              Kaizen provides a SaaS platform with various features and services as described on our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
            <p className="mb-4">
              Users are responsible for maintaining the confidentiality of their account and password and for restricting access to their computer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
            <p className="mb-4">
              Subscription fees are billed in advance on a monthly or annual basis and are non-refundable except as specified in our refund policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Termination</h2>
            <p className="mb-4">
              Either party may terminate this agreement at any time with or without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us at support@kaizen.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}