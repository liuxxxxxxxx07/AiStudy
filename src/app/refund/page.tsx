import LegalPage from "@/components/LegalPage";

export default function RefundPage() {
  return (
    <LegalPage title="Refund Policy">
      <h2 className="text-lg font-semibold mt-8 mb-2">1. Free Trial</h2>
      <p>
        All paid plans include a 7-day free trial. You will not be charged until the trial period ends. If you cancel during the trial, you will never be charged.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">2. Money-Back Guarantee</h2>
      <p>
        We offer a <strong>14-day money-back guarantee</strong> on all paid plans. If you are not satisfied within the first 14 days of your paid subscription, contact us for a full refund — no questions asked.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">3. Refund Eligibility</h2>
      <p>
        Refunds are processed under the following conditions:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>First 14 days:</strong> Full refund for any reason.</li>
        <li><strong>After 14 days:</strong> Refunds are not provided for partial months. You may cancel at any time, and access continues until the end of your current billing period.</li>
        <li><strong>Annual plans:</strong> Prorated refunds may be considered on a case-by-case basis after the 14-day window.</li>
        <li><strong>Duplicate charges:</strong> Full refund issued immediately upon notification.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-8 mb-2">4. How to Request a Refund</h2>
      <p>
        To request a refund, contact us at <a href="mailto:support@stem-aistudy.com" className="text-foreground underline underline-offset-2">support@stem-aistudy.com</a>. Include your account email and reason for the request. Refunds are processed within 5–10 business days.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">5. Credit Refunds</h2>
      <p>
        AI credits are a monthly usage allocation and have no monetary value. Unused credits are not refundable and do not roll over. Refunds apply to subscription fees only, not to consumed credits.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">6. Cancellation</h2>
      <p>
        You can cancel your subscription at any time from your account settings. Cancellation stops future billing but does not trigger a refund for the current period (except under the 14-day guarantee). Your paid features remain active until the end of the billing cycle.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">7. Billing Errors</h2>
      <p>
        If you believe you were charged incorrectly, contact us within 60 days of the charge. We will investigate and issue a refund for any verified errors.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">8. Contact</h2>
      <p>
        For refund requests or billing questions, contact us at <a href="mailto:support@stem-aistudy.com" className="text-foreground underline underline-offset-2">support@stem-aistudy.com</a>.
      </p>
    </LegalPage>
  );
}