import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await requireAdmin();

  return (
    <div>
      <div className="border-b border-line bg-sand">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
              Admin
            </span>
            <nav className="flex items-center gap-5">
              <Link
                href="/admin"
                className="text-muted transition-colors hover:text-gold-text"
              >
                Guides
              </Link>
              <Link
                href="/admin/articles"
                className="text-muted transition-colors hover:text-gold-text"
              >
                Articles
              </Link>
              <Link
                href="/admin/community"
                className="text-muted transition-colors hover:text-gold-text"
              >
                Community
              </Link>
              <Link
                href="/admin/giving"
                className="text-muted transition-colors hover:text-gold-text"
              >
                Giving
              </Link>
              <Link
                href="/admin/outreach"
                className="text-muted transition-colors hover:text-gold-text"
              >
                Outreach
              </Link>
            </nav>
            <span className="text-muted">{email}</span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-muted transition-colors hover:text-gold-text"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
