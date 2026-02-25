import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { prisma } from "@/lib/db";

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

async function verifyToken(token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
  });

  if (!user) return false;

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null },
  });

  return true;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const t = await getTranslations("auth.verify_email");
  const { token } = await searchParams;

  let success: boolean | null = null;

  if (token) {
    try {
      success = await verifyToken(token);
    } catch {
      success = false;
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {!token && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">{t("verifying")}</p>
            </div>
          )}

          {success === true && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium text-green-700">{t("success")}</p>
              <Link
                href="/auth/login"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {t("login_link")}
              </Link>
            </div>
          )}

          {success === false && (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="h-12 w-12 text-destructive" />
              <Alert variant="destructive">
                <AlertDescription>{t("error")}</AlertDescription>
              </Alert>
              <Link
                href="/auth/login"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {t("login_link")}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
