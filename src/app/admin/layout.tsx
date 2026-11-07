// AccountStoreOne — admin server gate.
// Runs on the server for every /admin/* page: no session → /login;
// session without an admin/moderator profile role → hard forbidden page.
// (The client screens repeat the role check for UX, and every API route
// enforces it again — this layout is the page-level guarantee.)
//
// Fix round: the profile lookup is retried (3 attempts, 800ms/1.6s
// backoff). A valid staff session used to render Forbidden whenever the
// Neon round-trip hiccupped, because a failed/slow read returned null
// and null meant "no such profile". If the profile is STILL unreadable
// after the retries, the gate bounces to /admin instead of Forbidden:
// by then the client gate inside that page either restores the session
// and renders the console, or shows its own retry screen — Forbidden is
// reserved for a profile that exists with a non-staff role (below) and
// for deactivated managers. (A persistent DB outage would loop this
// bounce; the client page's bounded restore + retry screen is the
// terminal state, so the loop cannot spin forever in practice.)

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { fetchAuthUser } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function AdminGateLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const user = await fetchAuthUser(h.get("cookie"));
  if (!user) redirect("/login?next=/admin");

  let profile: Awaited<ReturnType<typeof prisma.profile.findUnique>> = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(800 * attempt);
    profile = await prisma.profile.findUnique({ where: { id: user.id } }).catch(() => null);
    if (profile) break;
  }
  if (!profile) redirect("/admin");
  // A deactivated manager (suspended by a full admin) loses console
  // access entirely — same forbidden page as any non-staff account.
  let managerDeactivated = false;
  if (profile?.role === "moderator") {
    const rp = await prisma.userRiskProfile
      .findUnique({ where: { userId: user.id }, select: { isBlocked: true } })
      .catch(() => null);
    managerDeactivated = !!rp?.isBlocked;
  }
  if (profile.role !== "admin" && profile.role !== "moderator" || managerDeactivated) {
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
