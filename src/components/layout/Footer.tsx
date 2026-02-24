"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImpressumModal } from "@/components/ImpressumModal";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const t = useTranslations("footer");
  const [impressumOpen, setImpressumOpen] = useState(false);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <Separator className="mb-6" />
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t("copyright", { year })}
          </p>
          <button
            onClick={() => setImpressumOpen(true)}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition-colors"
          >
            {t("impressum")}
          </button>
        </div>
      </div>
      <ImpressumModal
        open={impressumOpen}
        onClose={() => setImpressumOpen(false)}
      />
    </footer>
  );
}
