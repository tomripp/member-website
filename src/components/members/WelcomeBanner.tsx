"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

type UserData = { name: string | null; email: string } | null;

export function WelcomeBanner() {
  const t = useTranslations("members");
  const [user, setUser] = useState<UserData>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => {});
  }, []);

  return (
    <section className="bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-16 text-white">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <Badge className="bg-white/20 text-white hover:bg-white/20 border-0">
            {t("badge")}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">
          {t("welcome", { name: user ? (user.name ?? user.email) : "…" })}
        </h1>
        <p className="mt-3 text-slate-300">{t("subtitle")}</p>
      </div>
    </section>
  );
}
