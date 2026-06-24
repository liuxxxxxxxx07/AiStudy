"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PaymentPlans from "@/components/PaymentPlans";
import { getCreditData } from "@/lib/credits";
import { getSupabase } from "@/lib/supabase";

export default function PricingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [currentTier, setCurrentTier] = useState("free");

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
  }, []);

  return (
    <PaymentPlans
      onBack={() => router.push("/")}
      userId={userId}
      userEmail={userEmail}
      currentTier={currentTier}
    />
  );
}