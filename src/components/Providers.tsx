"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { I18nProvider } from "@/lib/i18n";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <I18nProvider>
        {mounted ? children : <div className="h-full bg-background" />}
      </I18nProvider>
    </ThemeProvider>
  );
}
