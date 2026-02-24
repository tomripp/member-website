import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Star, Sparkles } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("members");
  return { title: t("title") };
}

export default async function MembersPage() {
  const user = await getCurrentUser();
  const locale = await getLocale();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const t = await getTranslations("members");

  const articles = [
    {
      key: "article1" as const,
      icon: Star,
      iconColor: "text-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      key: "article2" as const,
      icon: Sparkles,
      iconColor: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      key: "article3" as const,
      icon: Lock,
      iconColor: "text-blue-500",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-16 text-white">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-white/20 text-white hover:bg-white/20 border-0">
              {t("badge")}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            {t("welcome", { name: user.name ?? user.email })}
          </h1>
          <p className="mt-3 text-slate-300">{t("subtitle")}</p>
        </div>
      </section>

      {/* Premium Content */}
      <section className="px-4 py-16 bg-background">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-8 text-2xl font-bold">{t("articles.title")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map(({ key, icon: Icon, iconColor, bg }) => (
              <Card
                key={key}
                className="border-0 shadow-md cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <CardHeader>
                  <div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}
                  >
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      {t(`articles.${key}.title`)}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {t("articles.badge")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    {t(`articles.${key}.description`)}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusive resources placeholder */}
      <section className="px-4 py-12 bg-slate-50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-6 text-xl font-semibold">{t("resources.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(["videos", "code", "forum", "support"] as const).map((key) => (
              <Card
                key={key}
                className="border-dashed border-2 border-slate-200 bg-white text-center p-6 cursor-pointer hover:border-primary/40 transition-colors"
              >
                <p className="font-medium text-sm">{t(`resources.${key}`)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("resources.coming_soon")}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
