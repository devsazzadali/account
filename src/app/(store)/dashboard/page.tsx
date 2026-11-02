"use client";

import { Suspense } from "react";
import { UserDashboardPage } from "@/src/screens/UserDashboardPage";

// UserDashboardPage reads ?tab= via useSearchParams (Fix Round 4,
// item 2) — Next requires a Suspense boundary around it.
export default function DashboardRoute() {
  return (
    <Suspense fallback={null}>
      <UserDashboardPage />
    </Suspense>
  );
}
