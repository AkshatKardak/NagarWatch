"use client";

import React, { useEffect } from "react";
import { MunicipalAnalyticsHub } from "@/components/analytics/MunicipalAnalyticsHub";

export default function PublicAnalyticsPage() {
  useEffect(() => {
    document.title = "NagarWatch — Municipal Governance Analytics";
  }, []);

  return (
    <main className="min-h-screen bg-[#FAF8F5] pt-24 pb-20 px-4 sm:px-6">
      <MunicipalAnalyticsHub isAdmin={false} />
    </main>
  );
}
