"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

// Static resource bundles for instantaneous client hydration
import enCommon from "../../public/locales/en/common.json";
import enComplaints from "../../public/locales/en/complaints.json";
import enDashboard from "../../public/locales/en/dashboard.json";

import hiCommon from "../../public/locales/hi/common.json";
import hiComplaints from "../../public/locales/hi/complaints.json";
import hiDashboard from "../../public/locales/hi/dashboard.json";

import mrCommon from "../../public/locales/mr/common.json";
import mrComplaints from "../../public/locales/mr/complaints.json";
import mrDashboard from "../../public/locales/mr/dashboard.json";

const resources = {
  en: {
    common: enCommon,
    complaints: enComplaints,
    dashboard: enDashboard,
  },
  hi: {
    common: hiCommon,
    complaints: hiComplaints,
    dashboard: hiDashboard,
  },
  mr: {
    common: mrCommon,
    complaints: mrComplaints,
    dashboard: mrDashboard,
  },
};

// Only initialize once
if (!i18n.isInitialized) {
  const savedLng =
    typeof window !== "undefined" ? localStorage.getItem("language") || "en" : "en";

  i18n
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLng,
      fallbackLng: "en",
      supportedLngs: ["en", "hi", "mr"],
      defaultNS: "common",
      ns: ["common", "complaints", "dashboard"],
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
