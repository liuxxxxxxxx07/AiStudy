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
        <div className="border-t border-divider pt-6 text-xs text-muted/50">
          <a href="/" className="hover:text-foreground transition-colors">AI Study</a>
          {" · "}
          <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
          {" · "}
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
          {" · "}
          <a href="/refund" className="hover:text-foreground transition-colors">Refund</a>
        </div>
      </div>
    </div>
  );
}