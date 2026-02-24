"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormData = z.infer<typeof formSchema>;

export function LoginForm() {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    setShowResend(false);
    setResendSent(false);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          setError(t("error_unverified"));
          setShowResend(true);
        } else {
          setError(t("error_invalid"));
        }
        return;
      }

      router.push("/members");
      router.refresh();
    } catch {
      setError(t("error_invalid"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const email = form.getValues("email");
    if (!email) return;

    setResendLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      setResendSent(true);
      setShowResend(false);
      setError(null);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resendSent && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{t("resend_success")}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t("password")}</FormLabel>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  {t("forgot_password")}
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "..." : t("submit")}
        </Button>

        {showResend && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={resendLoading}
            onClick={handleResend}
          >
            {resendLoading ? "..." : t("resend_verification")}
          </Button>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {t("no_account")}{" "}
          <Link
            href="/auth/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("register_link")}
          </Link>
        </p>
      </form>
    </Form>
  );
}
