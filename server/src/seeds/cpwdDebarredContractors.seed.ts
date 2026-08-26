import BlacklistedContractor from "../models/BlacklistedContractor";

export const CPWD_DEBARRED_DATASET = [
  {
    contractorName: "Shree Ganesh Constructions (Debarred)",
    reason: "Substandard road bituminous material and repeated SLA failure on national highway corridor",
    blacklistedAt: new Date("2023-04-10"),
    source: "CPWD_DEBARRED",
  },
  {
    contractorName: "Falcon Electricals & Power Syndicate",
    reason: "Willful abandonment of municipal transformer upgrade contract and non-compliance with safety codes",
    blacklistedAt: new Date("2022-11-18"),
    source: "CPWD_DEBARRED",
  },
  {
    contractorName: "Navjivan Waste Disposal Co",
    reason: "Fraudulent weighbridge records and illegal dumping in catchment conservation zone",
    blacklistedAt: new Date("2023-09-05"),
    source: "CPWD_DEBARRED",
  },
  {
    contractorName: "Royal Infra Builders & Developers",
    reason: "Forged bank guarantees during municipal tender submission",
    blacklistedAt: new Date("2024-01-15"),
    source: "CPWD_DEBARRED",
  },
  {
    contractorName: "Apex Drainage Ventures (Blacklisted Entity)",
    reason: "Defective pipeline installation resulting in severe urban flooding",
    blacklistedAt: new Date("2023-07-20"),
    source: "CPWD_DEBARRED",
  },
];

export async function seedCPWDDebarredContractors(): Promise<{ total: number; created: number }> {
  let list = CPWD_DEBARRED_DATASET;

  const apiUrl = process.env.CPWD_DEBARRED_API || "https://opendata.best/api/v1/in_cpwd_debarred_contractors";
  try {
    const res = await fetch(apiUrl, { method: "GET" });
    if (res.ok) {
      const data = (await res.json()) as any;
      const apiList = Array.isArray(data) ? data : data.data || data.results || [];
      if (apiList.length > 0) {
        list = apiList.map((item: any) => ({
          contractorName: item.contractor_name || item.name || "Debarred Contractor",
          reason: item.reason || "Debarred as per CPWD circular",
          blacklistedAt: item.debarred_date ? new Date(item.debarred_date) : new Date(),
          source: "CPWD_DEBARRED",
        }));
      }
    }
  } catch {}

  let created = 0;

  for (const item of list) {
    const exists = await BlacklistedContractor.findOne({ contractorName: item.contractorName });
    if (!exists) {
      await BlacklistedContractor.create(item);
      created++;
    }
  }

  console.log(`✅ [CPWD Debarred Seed Complete] Total: ${list.length}, Added: ${created}`);
  return { total: list.length, created };
}
