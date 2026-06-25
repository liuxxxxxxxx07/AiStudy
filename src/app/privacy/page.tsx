import LegalPage from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <h2 className="text-lg font-semibold mt-8 mb-2">1. Information We Collect</h2>
      <p>
        We collect information you provide when creating an account (email, name) and when using the Service (questions asked, answers generated, files uploaded, knowledge base entries, wiki content, flashcard progress, exam results, search queries).
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">2. How We Use Your Information</h2>
      <p>
        Your data is used to:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Provide and improve the AI Study service</li>
        <li>Personalize your learning experience</li>
        <li>Process payments and manage subscriptions</li>
        <li>Send service-related communications</li>
        <li>Generate anonymous usage analytics to improve features</li>
      </ul>

      <h2 className="text-lg font-semibold mt-8 mb-2">3. AI Data Processing</h2>
      <p>
        Questions and content you submit may be processed by third-party AI providers (such as OpenAI, Anthropic, DeepSeek, Qwen, Tencent) to generate responses. We do not use your content to train AI models unless explicitly and separately authorized. All AI providers are contractually obligated to maintain confidentiality.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">4. Data Storage & Retention</h2>
      <p>
        Your data is stored securely on our servers and in your browser localStorage for offline resilience. We retain your data for as long as your account is active. Upon account deletion, all personal data is permanently deleted within 30 days, except where legal obligations require retention.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">5. Payment Processing</h2>
      <p>
        Payment transactions are processed securely by <strong>Paddle</strong>. We do not store full credit card numbers. Paddle has its own privacy policy governing payment data. By subscribing, you agree to Paddle&apos;s terms for payment processing.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">6. Cookies</h2>
      <p>
        We use essential cookies for authentication and session management. We do not use tracking cookies or third-party advertising cookies.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">7. Data Sharing</h2>
      <p>
        We do not sell your personal data. We may share data with:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>AI model providers (only the content you submit for processing)</li>
        <li>Payment processors (only for billing purposes)</li>
        <li>Cloud infrastructure providers (for hosting and storage)</li>
        <li>Legal authorities if required by law</li>
      </ul>

      <h2 className="text-lg font-semibold mt-8 mb-2">8. Your Rights</h2>
      <p>
        You have the right to:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Access, export, or delete your data at any time</li>
        <li>Update or correct your account information</li>
        <li>Cancel your subscription</li>
        <li>Request a copy of all data we hold about you</li>
      </ul>
      <p>
        To exercise these rights, go to your profile settings (click your avatar in the sidebar) and use the "Your Data" section, or contact us at <a href="mailto:support@stem-aistudy.com" className="text-foreground underline underline-offset-2">support@stem-aistudy.com</a>.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">9. Data Security</h2>
      <p>
        We implement industry-standard security measures including encryption in transit (TLS) and at rest, regular security audits, and access controls. However, no online service can guarantee absolute security.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy. Material changes will be communicated via email or in-app notification.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">11. Contact</h2>
      <p>
        For privacy-related inquiries, contact us at <a href="mailto:support@stem-aistudy.com" className="text-foreground underline underline-offset-2">support@stem-aistudy.com</a>.
      </p>
    </LegalPage>
  );
}