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
      <div className="border-b border-[#E5D9C7] bg-[#F3EADC]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="text-[#8B5E34]">
              Admin
            </Link>
            <span className="text-[#6B5F53]">{email}</span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-[#5C5147] transition-colors hover:text-[#8B5E34]"
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
