import type { Route } from "./+types/privacy";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Privacy Policy - Kaizen" },
    { name: "description", content: "Privacy Policy for Kaizen" },
  ];
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information you provide directly to us, such as when you create an account, subscribe to our service, or contact us for support.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">
              We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Data Sharing and Disclosure</h2>
            <p className="mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
            </p>
            <h3 className="text-xl font-semibold mb-2">Service Providers</h3>
            <p className="mb-4">
              We may share your information with third-party service providers who assist us in operating our platform, conducting our business, or serving you.
            </p>
            <h3 className="text-xl font-semibold mb-2">Legal Requirements</h3>
            <p className="mb-4">
              We may disclose your information if required to do so by law or in response to valid requests by public authorities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="mb-4">
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <p className="mb-4">
              You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at privacy@kaizen.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}