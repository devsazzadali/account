// AccountStoreOne — admin server gate.
// Runs on the server for every /admin/* page: no session → /login;
// session without an admin/moderator profile role → hard forbidden page.
// (The client screens repeat the role check for UX, and every API route
// enforces it again — this layout is the page-level guarantee.)

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { fetchAuthUser } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";

export default async function AdminGateLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const user = await fetchAuthUser(h.get("cookie"));
  if (!user) redirect("/login?next=/admin");

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-10 bg-[#f8fafc]">
        <div className="bg-white p-16 rounded-[3rem] border border-slate-200 shadow-2xl max-w-xl">
          <ShieldAlert size={80} className="text-red-500 mx-auto mb-8" />
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight italic">Access Forbidden</h2>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">
            Your account does not have administrative clearance for this store. If you are the store owner, sign in with the admin account.
          </p>
          <Link href="/" className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
            <ArrowLeft size={18} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
