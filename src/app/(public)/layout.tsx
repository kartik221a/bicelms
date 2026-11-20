import { SetupBanner } from "@/components/shared/setup-banner";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { getSession } from "@/services/auth/session";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <SetupBanner />
      <SiteHeader user={session} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
