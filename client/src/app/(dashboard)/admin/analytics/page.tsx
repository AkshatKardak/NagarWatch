"use client";

import React, { useEffect } from "react";
import { MunicipalAnalyticsHub } from "@/components/analytics/MunicipalAnalyticsHub";

export default function AdminAnalyticsPage() {
  useEffect(() => {
    document.title = "NagarWatch Admin — Municipal Governance Analytics";
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <MunicipalAnalyticsHub isAdmin={true} />
    </div>
  );
}
