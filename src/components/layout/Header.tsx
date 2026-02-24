import { useTranslations } from "next-intl";
import { getCurrentUser } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { UserNav } from "./UserNav";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function Header() {
  const t = useTranslations("nav");
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-foreground hover:opacity-80 transition-opacity"
        >
          MyWebsite
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("home")}
          </Link>
          {user && (
            <Link
              href="/members"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("members")}
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <UserNav user={user} />
        </div>
      </div>
    </header>
  );
}
