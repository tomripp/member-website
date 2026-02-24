"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

interface ImpressumModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImpressumModal({ open, onClose }: ImpressumModalProps) {
  const t = useTranslations("impressum");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{t("responsible")}</p>
          <p>{t("name")}</p>
          <p>{t("street")}</p>
          <p>{t("city")}</p>
          <p>{t("country")}</p>
          <p className="pt-2">
            <span className="font-medium text-foreground">{t("email_label")}</span>{" "}
            {t("email")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
