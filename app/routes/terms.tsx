import type { Route } from "./+types/terms";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Terms of Service - TradeBoost AI" },
    { name: "description", content: "Terms of Service for TradeBoost AI" },
  ];
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl font-bold mb-8">TradeBoost Terms of Service</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: October 7, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By creating an account or using TradeBoost, you agree to these Terms of Service ("Terms"). If you do not agree, do not access or use the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Services</h2>
            <p className="mb-4">
              TradeBoost delivers AI-assisted advertising campaign generation, Google Ads drafting, and performance dashboards for plumbers and electricians.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Eligibility</h2>
            <p className="mb-4">
              You must be at least 18 and capable of entering a binding contract. If you register on behalf of a business, you confirm you have authority to bind that entity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Accounts & Security</h2>
            <ul className="mb-4 list-disc pl-6">
              <li>Use accurate registration information and keep your credentials confidential.</li>
              <li>You are responsible for activities occurring under your account.</li>
              <li>Notify us promptly via in-app support if you suspect unauthorized access.</li>
            </ul>
          </section>

          <section className="mb-8 bg-red-50 border border-red-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-red-700">⚠️ CRITICAL: User Compliance Responsibilities</h2>

            <h3 className="text-xl font-semibold mb-3 text-red-600">Advertising Compliance</h3>
            <p className="mb-4 text-red-700">
              <strong>YOU ARE SOLELY RESPONSIBLE</strong> for ensuring all advertising content complies with UK regulations including:
            </p>
            <ul className="mb-4 list-disc pl-6 text-red-700">
              <li>Trading Standards regulations and advertising codes</li>
              <li>Industry-specific certification requirements (Gas Safe, Part P, etc.)</li>
              <li>Consumer protection laws and truthful advertising standards</li>
              <li>Competition and Markets Authority guidelines</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-red-600">Required Certifications & Insurance</h3>
            <p className="mb-4 text-red-700">
              You warrant and represent that you possess and maintain:
            </p>
            <ul className="mb-4 list-disc pl-6 text-red-700">
              <li><strong>Valid business registration</strong> with HMRC or Companies House</li>
              <li><strong>Public Liability Insurance</strong> of at least £1,000,000 coverage</li>
              <li><strong>Gas Safe Registration</strong> (if advertising gas-related services)</li>
              <li><strong>Part P Certification</strong> (if advertising electrical work)</li>
              <li><strong>All relevant trade licenses</strong> required for your advertised services</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-red-600">No Legal or Compliance Advice</h3>
            <p className="mb-4 text-red-700">
              <strong>TradeBoost AI DOES NOT provide legal, regulatory, or compliance advice.</strong> Our AI suggestions are not legal guidance. You must:
            </p>
            <ul className="mb-4 list-disc pl-6 text-red-700">
              <li>Consult qualified legal professionals for compliance advice</li>
              <li>Verify all advertising claims with relevant regulatory bodies</li>
              <li>Ensure all generated content is accurate before publication</li>
              <li>Take full responsibility for all advertising content and claims</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-red-600">Prohibited Content</h3>
            <p className="mb-4 text-red-700">
              You may not create or publish advertisements containing:
            </p>
            <ul className="mb-4 list-disc pl-6 text-red-700">
              <li>False certification claims (e.g., claiming Gas Safe registration without valid certification)</li>
              <li>Misleading availability claims (e.g., "24/7 service" without actual 24/7 availability)</li>
              <li>Unsubstantiated guarantees or pricing claims</li>
              <li>Services you are not qualified, licensed, or insured to provide</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Subscriptions & Billing</h2>
            <ul className="mb-4 list-disc pl-6">
              <li>TradeBoost operates on monthly subscriptions via Polar.sh.</li>
              <li>Fees are billed in advance; you authorize recurring charges until canceling your plan.</li>
              <li>Upgrades or downgrades take effect at the next billing cycle unless otherwise stated.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. No Refund Policy</h2>
            <p className="mb-4">
              All payments are final. We do not provide refunds or credits for partial months, downgrades, or unused services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Acceptable Use</h2>
            <ul className="mb-4 list-disc pl-6">
              <li>Do not misuse the platform, reverse engineer, or interfere with service integrity.</li>
              <li>Do not upload unlawful content or violate advertising regulations (e.g., Gas Safe claims without certification).</li>
              <li>We may suspend or terminate accounts engaging in prohibited conduct.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Ownership & License</h2>
            <ul className="mb-4 list-disc pl-6">
              <li>TradeBoost retains all rights to the platform, including generated campaign templates.</li>
              <li>We grant you a limited, non-exclusive, non-transferable license to use outputs for your business advertising only. You may not resell or redistribute generated content to third parties.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
            <p className="mb-4">
              Integrations (Clerk, Polar.sh, Google Ads, OpenAI, Resend, Vercel) are governed by their own terms. You are responsible for complying with those agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Privacy</h2>
            <p className="mb-4">
              Our Privacy Policy governs how we collect and process personal data. By using TradeBoost, you consent to that processing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Service Modifications</h2>
            <p className="mb-4">
              We may update features, suspend access, or discontinue the service. We will provide reasonable notice of material changes when possible.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Disclaimers</h2>
            <p className="mb-4">
              TradeBoost is provided "as is". We do not guarantee specific lead volumes, campaign performance, or uninterrupted availability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Limitation of Liability</h2>
            <p className="mb-4">
              To the fullest extent permitted by law, TradeBoost, its directors, and affiliates are not liable for indirect, incidental, consequential, or punitive damages. Liability for direct damages is limited to the fees paid in the previous 12 months.
            </p>
          </section>

          <section className="mb-8 bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-700">14. Indemnification & Legal Protection</h2>

            <h3 className="text-xl font-semibold mb-3 text-yellow-600">Full User Indemnification</h3>
            <p className="mb-4 text-yellow-700">
              You agree to <strong>indemnify, defend, and hold harmless</strong> TradeBoost AI, its directors, officers, employees, and affiliates from and against any and all:
            </p>
            <ul className="mb-4 list-disc pl-6 text-yellow-700">
              <li><strong>Legal claims or lawsuits</strong> arising from your advertising content or business operations</li>
              <li><strong>Regulatory investigations</strong> by Trading Standards, Gas Safe Register, or other authorities</li>
              <li><strong>Compliance violations</strong> including false advertising, certification claims, or service representations</li>
              <li><strong>Customer disputes</strong> related to services you advertise or provide</li>
              <li><strong>Insurance claims or damages</strong> resulting from your work or advertising</li>
              <li><strong>Tax or business registration issues</strong> related to your use of the platform</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-yellow-600">Limitation of TradeBoost AI Liability</h3>
            <p className="mb-4 text-yellow-700">
              TradeBoost AI's liability is limited to the subscription fees paid in the previous 12 months. We are not liable for:
            </p>
            <ul className="mb-4 list-disc pl-6 text-yellow-700">
              <li>Compliance violations in user-generated content</li>
              <li>False or misleading advertising claims made by users</li>
              <li>Work quality, safety, or certification issues</li>
              <li>Customer disputes or unsatisfied service claims</li>
              <li>Lost business, revenue, or reputation</li>
              <li>Regulatory fines or legal penalties imposed on users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Governing Law</h2>
            <p className="mb-4">
              These Terms are governed by the laws of your country of residence. Any dispute will be brought in the competent courts of that jurisdiction, unless prohibited by local law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Changes to Terms</h2>
            <p className="mb-4">
              We may revise these Terms; continued use constitutes acceptance. We will notify you of material updates through the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17. Contact</h2>
            <p className="mb-4">
              For questions, please use the in-app support channel. A dedicated email address will be added in future communications.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}