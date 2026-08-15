"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", native: "हिंदी", flag: "🇮🇳" },
  { code: "mr", label: "Marathi", native: "मराठी", flag: "🇮🇳" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("language");
    if (saved && languages.some((l) => l.code === saved) && i18n.language !== saved) {
      void i18n.changeLanguage(saved);
    }
  }, [i18n]);

  const handleLanguageChange = (lng: string) => {
    void i18n.changeLanguage(lng);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lng);
      document.documentElement.lang = lng;
    }
  };

  if (!mounted) {
    return (
      <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg border border-border/40 bg-background/50 ${className || ""}`}>
        <Globe className="size-3.5 text-muted-foreground" />
        <span>English</span>
      </div>
    );
  }

  const currentLang = i18n.language?.split("-")[0] || "en";

  return (
    <Select value={currentLang} onValueChange={handleLanguageChange}>
      <SelectTrigger
        className={`h-9 w-[130px] rounded-lg border-border/60 bg-background/80 text-xs font-semibold backdrop-blur transition-all hover:bg-black/5 dark:hover:bg-white/5 ${className || ""}`}
      >
        <Globe className="size-3.5 mr-1 text-primary shrink-0" />
        <SelectValue placeholder="Language">
          {languages.find((l) => l.code === currentLang)?.native || "English"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="rounded-xl border-border shadow-xl">
        {languages.map((lang) => (
          <SelectItem
            key={lang.code}
            value={lang.code}
            className="text-xs font-medium cursor-pointer py-2"
          >
            <span className="mr-2">{lang.flag}</span>
            <span className="font-semibold">{lang.native}</span>
            <span className="ml-1.5 text-[11px] text-muted-foreground">({lang.label})</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
