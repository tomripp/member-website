import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Lock, Shield } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home.hero");
  return { title: t("title") };
}

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-24 text-white sm:py-32">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mb-10 text-lg text-slate-300 sm:text-xl max-w-2xl mx-auto">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="min-w-40">
              <Link href="/auth/register">{t("hero.cta_register")}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="min-w-40 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/auth/login">{t("hero.cta_members")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-background">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            {t("features.title")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">{t("features.free.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {t("features.free.description")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <Lock className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">{t("features.members.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {t("features.members.description")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md sm:col-span-2 lg:col-span-1">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">{t("features.secure.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {t("features.secure.description")}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Free Content Preview */}
      <section className="px-4 py-16 bg-slate-50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold tracking-tight">
            Latest Articles
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Introduction to Web Development",
                desc: "A beginner-friendly guide covering HTML, CSS, and JavaScript fundamentals.",
                tag: "Beginner",
              },
              {
                title: "Modern CSS Techniques",
                desc: "Explore Flexbox, Grid, and CSS custom properties for responsive layouts.",
                tag: "Intermediate",
              },
              {
                title: "JavaScript Best Practices",
                desc: "Write cleaner, more maintainable JavaScript with these proven techniques.",
                tag: "Intermediate",
              },
              {
                title: "TypeScript for Beginners",
                desc: "Add type safety to your JavaScript projects with TypeScript.",
                tag: "Beginner",
              },
            ].map((article) => (
              <Card
                key={article.title}
                className="cursor-pointer transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{article.title}</CardTitle>
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {article.tag}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{article.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary px-4 py-20 text-primary-foreground">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">{t("cta.title")}</h2>
          <p className="mb-8 text-primary-foreground/80 text-lg">
            {t("cta.subtitle")}
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="min-w-48"
          >
            <Link href="/auth/register">{t("cta.button")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
