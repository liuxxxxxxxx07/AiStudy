import LegalPage from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <h2 className="text-lg font-semibold mt-8 mb-2">1. Operator</h2>
      <p>
        AI Study is operated by <strong>刘雄 (Liu Xiong)</strong>, an individual developer. If you have any questions, please contact us at <a href="mailto:support@stem-aistudy.com" className="text-foreground underline underline-offset-2">support@stem-aistudy.com</a>.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">2. Acceptance of Terms</h2>
      <p>
        By accessing or using AI Study ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">3. Description of Service</h2>
      <p>
        AI Study is a STEM learning platform that provides AI-powered problem solving, knowledge management (Knowledge Base, Personal Wiki, Question Bank), study tools (Flashcards, Mock Exams, Search), and related features.
      </p>
      <p>
        We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time with reasonable notice.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">4. User Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate, current information during registration.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">5. Subscriptions & Billing</h2>
      <p>
        Paid plans are billed monthly or annually as selected, processed securely by Paddle. Subscriptions auto-renew unless cancelled before the renewal date. You may cancel at any time through your account settings or by contacting <a href="mailto:support@stem-aistudy.com" className="text-foreground underline underline-offset-2">support@stem-aistudy.com</a>. Upon cancellation, access to paid features continues until the end of the current billing period.
      </p>
      <p>
        Pricing and plan features are subject to change with 30 days&apos; notice. Existing subscribers will be grandfathered at their current rate for one billing cycle.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">6. Credits</h2>
      <p>
        AI credits are a monthly quota allocated per plan. Unused credits do not roll over to the next month. Credits are non-transferable and have no cash value.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">7. Acceptable Use</h2>
      <p>
        You agree not to:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Use the Service for any illegal purpose</li>
        <li>Attempt to bypass credit limits or access restrictions</li>
        <li>Reverse-engineer, scrape, or abuse the API</li>
        <li>Upload malicious content or infringe on others&apos; intellectual property</li>
        <li>Use automated scripts to generate excessive requests</li>
      </ul>

      <h2 className="text-lg font-semibold mt-8 mb-2">8. Limitation of Liability</h2>
      <p>
        AI Study provides AI-generated content for educational assistance only. We do not guarantee accuracy, completeness, or exam-specific relevance. The Service is provided &quot;as is&quot; without warranties of any kind. Our total liability is limited to the amount paid by you in the 12 months preceding the claim.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">9. Governing Law & Dispute Resolution</h2>
      <p>
        These terms are governed by the laws of the People&apos;s Republic of China. Any disputes arising from these terms shall first be resolved through friendly negotiation. If negotiation fails, the dispute shall be submitted to the competent court in the operator&apos;s jurisdiction.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">10. Changes to Terms</h2>
      <p>
        We may update these terms at any time. Continued use after changes constitutes acceptance. We will notify subscribers of material changes via email.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">11. Contact</h2>
      <p>
        For questions about these terms, contact us at <a href="mailto:support@stem-aistudy.com" className="text-foreground underline underline-offset-2">support@stem-aistudy.com</a>.
      </p>
    </LegalPage>
  );
}