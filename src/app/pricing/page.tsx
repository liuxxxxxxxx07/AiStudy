"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PaymentPlans from "@/components/PaymentPlans";
import { getCreditData } from "@/lib/credits";
import { getSupabase } from "@/lib/supabase";
import { createCheckoutSession, getHealth } from "@/lib/payment-client";

export default function PricingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [currentTier, setCurrentTier] = useState("free");
  const [provider, setProvider] = useState<"stripe" | "paypal" | "lemonsqueezy" | "paddle" | "payoneer">("paddle");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const uid = session.user.id || session.user.email || "";
        setUserId(uid);
        setUserEmail(session.user.email || undefined);
        if (uid) setCurrentTier(getCreditData(uid).tier);
      }
    });

    getHealth().then((health) => {
      if (health.providers.includes("paddle")) {
        setProvider("paddle");
      } else if (health.providers.includes("payoneer")) {
        setProvider("payoneer");
      } else if (health.providers.includes("stripe")) {
        setProvider("stripe");
      }
    }).catch(() => {});
  }, []);

  const handleSelect = useCallback(async (tierId: string) => {
    if (!userId) {
      router.push("/");
      return;
    }

    try {
      const checkout = await createCheckoutSession({
        tier: tierId,
        userId,
        userEmail,
        provider,
      });

      if (checkout.url) {
        window.location.href = checkout.url;
      }
    } catch (err) {
      console.error("Checkout failed:", err);
    }
  }, [userId, userEmail, provider, router]);

  return (
    <PaymentPlans
      onBack={() => router.push("/")}
      onSelect={handleSelect}
      userId={userId}
      userEmail={userEmail}
      currentTier={currentTier}
    />
  );
}