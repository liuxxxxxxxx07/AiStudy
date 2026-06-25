export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div>
          <a href="/" className="text-sm text-muted hover:text-foreground transition-colors">
            ← Back to app
          </a>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <div className="text-sm text-foreground/80 leading-relaxed space-y-4">
          {children}
        </div>
        <div className="border-t border-divider pt-6 text-xs text-muted/50 space-y-2">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/" className="hover:text-foreground transition-colors">AI Study</a>
            <span>·</span>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <span>·</span>
            <a href="/refund" className="hover:text-foreground transition-colors">Refund</a>
          </div>
          <div className="text-center">
            Contact: <a href="mailto:support@stem-aistudy.com" className="hover:text-foreground transition-colors underline underline-offset-2">support@stem-aistudy.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}