import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/navigation";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset_password");
  return { title: t("title") };
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const t = await getTranslations("auth.reset_password");
  const { token } = await searchParams;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          {token && <CardDescription>{t("subtitle")}</CardDescription>}
        </CardHeader>
        <CardContent>
          {!token ? (
            <Alert variant="destructive">
              <AlertDescription>{t("error")}</AlertDescription>
            </Alert>
          ) : (
            <ResetPasswordForm token={token} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
