import type { Route } from "./+types/privacy";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Privacy Policy - TradeBoost AI" },
    { name: "description", content: "Privacy Policy for TradeBoost AI" },
  ];
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl font-bold mb-8">TradeBoost Privacy Policy</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: October 7, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
            <p className="mb-4">
              TradeBoost ("we", "us", "our") provides an AI-driven advertising platform for UK trades. This Privacy Policy explains how we collect, use, and safeguard personal and non-personal data when you access or use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <ul className="mb-4 list-disc pl-6">
              <li><strong>Account Information:</strong> name, email address, and authentication data supplied via Clerk.</li>
              <li><strong>Billing Information:</strong> payment method details processed through Polar.sh; we store only necessary identifiers for billing status.</li>
              <li><strong>Usage Data:</strong> interactions with onboarding flows, campaign settings, and dashboard activity captured through Convex.</li>
              <li><strong>Cookies & Analytics:</strong> browser cookies, device identifiers, and analytics events for improving performance and security.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Information</h2>
            <ul className="mb-4 list-disc pl-6">
              <li>Provide, maintain, and improve the TradeBoost platform and AI campaign outputs.</li>
              <li>Process subscription payments, manage billing status, and prevent fraud.</li>
              <li>Communicate service updates, onboarding guidance, and critical alerts via Resend.</li>
              <li>Monitor usage trends, diagnose technical issues, and enhance user experience.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Legal Basis</h2>
            <p className="mb-4">
              We process personal data where it is necessary to perform our contract with you, comply with legal obligations, and pursue legitimate interests such as platform security and product improvement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Sharing & Disclosure</h2>
            <ul className="mb-4 list-disc pl-6">
              <li><strong>Infrastructure & Hosting:</strong> Vercel (application hosting) and Convex (real-time backend).</li>
              <li><strong>Authentication:</strong> Clerk for account creation and session management.</li>
              <li><strong>Billing & Payments:</strong> Polar.sh for subscription processing and invoicing.</li>
              <li><strong>Advertising Integrations:</strong> Google Ads API for campaign drafts and reporting.</li>
              <li><strong>AI Services:</strong> OpenAI to generate campaign copy using context you supply.</li>
              <li><strong>Email Delivery:</strong> Resend for transactional messages.</li>
              <li><strong>Compliance:</strong> We may disclose information when required by law or to protect rights, safety, or security.</li>
            </ul>
            <p className="mb-4">
              All third parties only receive the minimum data required to perform their services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. International Data Transfers</h2>
            <p className="mb-4">
              Our partners may operate in jurisdictions outside your home country. We rely on appropriate safeguards (such as Standard Contractual Clauses) where required by applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="mb-4">
              We retain personal data while your account is active and for a reasonable period afterward to meet legal, tax, or accounting requirements. We delete or anonymize data when it is no longer needed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
            <p className="mb-4">
              Depending on your location, you may request access, correction, deletion, restriction, portability, or objection to processing of your personal data. Submit requests through in-app support; we'll respond in line with applicable law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Cookies & Tracking</h2>
            <p className="mb-4">
              You can set your browser to refuse cookies, though certain features may become unavailable. We do not respond to Do Not Track signals at this time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="mb-4">
              TradeBoost is not directed to children under 16, and we do not knowingly collect personal data from them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Security</h2>
            <p className="mb-4">
              We implement administrative, technical, and physical safeguards to protect data, including encryption of sensitive credentials and role-based access controls.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. Material changes will be communicated through the dashboard or other prominent notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact</h2>
            <p className="mb-4">
              If you have questions or would like to exercise data rights, please reach out via the in-app support channel. A dedicated email address will be provided in future updates.
            </p>
          </section>

          <section className="mb-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700">14. Compliance & Regulatory Data</h2>

            <h3 className="text-xl font-semibold mb-3 text-blue-600">Certification Verification Data</h3>
            <p className="mb-4 text-blue-700">
              To ensure compliance with UK trade regulations, we may collect and verify:
            </p>
            <ul className="mb-4 list-disc pl-6 text-blue-700">
              <li><strong>Gas Safe registration numbers</strong> and certification documents</li>
              <li><strong>Part P electrical certification</strong> and qualification records</li>
              <li><strong>Public liability insurance</strong> policies and coverage details</li>
              <li><strong>Business registration information</strong> from Companies House or HMRC</li>
              <li><strong>Professional accreditation</strong> from trade bodies (NICEIC, etc.)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-blue-600">Compliance Monitoring</h3>
            <p className="mb-4 text-blue-700">
              We monitor advertising content for compliance purposes, including:
            </p>
            <ul className="mb-4 list-disc pl-6 text-blue-700">
              <li><strong>Automated scanning</strong> of generated advertising content</li>
              <li><strong>Violation tracking</strong> and compliance issue reporting</li>
              <li><strong>Certification status monitoring</strong> and renewal reminders</li>
              <li><strong>Regulatory correspondence</strong> if investigations occur</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-blue-600">Data Sharing for Compliance</h3>
            <p className="mb-4 text-blue-700">
              We may share information with regulatory authorities when legally required:
            </p>
            <ul className="mb-4 list-disc pl-6 text-blue-700">
              <li><strong>Trading Standards</strong> investigations of advertising practices</li>
              <li><strong>Gas Safe Register</strong> verification of certification claims</li>
              <li><strong>HMRC</strong> business registration and tax compliance inquiries</li>
              <li><strong>Consumer protection agencies</strong> investigating service complaints</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-blue-600">Data Retention for Legal Protection</h3>
            <p className="mb-4 text-blue-700">
              We retain different types of data for varying periods to meet legal obligations and protect against regulatory investigations:
            </p>
            <ul className="mb-4 list-disc pl-6 text-blue-700">
              <li><strong>Personal data</strong> (names, emails, contact info): 1 year after account closure</li>
              <li><strong>Compliance records</strong> (warnings shown, user acknowledgments): 6 years after account closure</li>
              <li><strong>Certification verification</strong> (Gas Safe checks, insurance validation): 6 years after account closure</li>
              <li><strong>Advertising content</strong> (generated campaigns, claims made): 6 years for regulatory compliance</li>
              <li><strong>Violation reports</strong> (compliance breaches, regulatory issues): 7 years for legal defense</li>
              <li><strong>Regulatory correspondence</strong> (Trading Standards communications): 7 years or as legally required</li>
            </ul>
            <p className="text-sm text-blue-600 mt-4">
              Extended retention periods protect both users and TradeBoost AI from potential legal claims that may arise years after account closure, in accordance with UK limitation periods and regulatory requirements.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}