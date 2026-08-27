"use client";

import dynamic from "next/dynamic";
import {
  Camera,
  ChevronLeft,
  Loader2,
  MapPin,
  Upload,
  Pencil,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  Languages,
  Search,
  Filter,
  Globe,
  ChevronDown,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { complaintsAPI, aiAPI } from "@/lib/api";
import { getCategoryLabel } from "@/lib/utils";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useComplaintStore } from "@/store/complaintStore";
import type { ComplaintCategory, IComplaint } from "@/types/complaint";
import { NearbyComplaintsModal } from "./NearbyComplaintsModal";
import {
  convertTo3Words,
  convertToCoordinates,
  isValid3Words,
  format3Words,
} from "@/lib/what3words";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), { ssr: false });

export interface IndianLanguage {
  code: string;
  key: string;
  label: string;
  native: string;
  state: string;
  zone: "All" | "South" | "North" | "West" | "East" | "Pan-India";
}

export const INDIAN_STATE_LANGUAGES: IndianLanguage[] = [
  { code: "en-IN", key: "en", label: "English", native: "English", state: "Pan-India Official", zone: "Pan-India" },
  { code: "hi-IN", key: "hi", label: "Hindi", native: "हिन्दी", state: "North & Central India", zone: "North" },
  { code: "mr-IN", key: "mr", label: "Marathi", native: "मराठी", state: "Maharashtra", zone: "West" },
  { code: "ta-IN", key: "ta", label: "Tamil", native: "தமிழ்", state: "Tamil Nadu & Puducherry", zone: "South" },
  { code: "te-IN", key: "te", label: "Telugu", native: "తెలుగు", state: "Andhra Pradesh & Telangana", zone: "South" },
  { code: "kn-IN", key: "kn", label: "Kannada", native: "ಕನ್ನಡ", state: "Karnataka", zone: "South" },
  { code: "bn-IN", key: "bn", label: "Bengali", native: "বাংলা", state: "West Bengal & Tripura", zone: "East" },
  { code: "gu-IN", key: "gu", label: "Gujarati", native: "ગુજરાતી", state: "Gujarat", zone: "West" },
  { code: "ml-IN", key: "ml", label: "Malayalam", native: "മലയാളം", state: "Kerala & Lakshadweep", zone: "South" },
  { code: "pa-IN", key: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", state: "Punjab & Chandigarh", zone: "North" },
  { code: "od-IN", key: "od", label: "Odia", native: "ଓଡ଼ିଆ", state: "Odisha", zone: "East" },
  { code: "as-IN", key: "as", label: "Assamese", native: "অসমীয়া", state: "Assam & North East", zone: "East" },
  { code: "ur-IN", key: "ur", label: "Urdu", native: "اردو", state: "Pan-India", zone: "Pan-India" },
];

const categories: ComplaintCategory[] = [
  "pothole",
  "garbage",
  "water",
  "streetlight",
  "road",
  "drainage",
  "other",
];

type LocationMode = "none" | "gps" | "map" | "w3w" | "manual";

interface FormState {
  title: string;
  description: string;
  category: ComplaintCategory;
  lat: number | null;
  lng: number | null;
  address: string;
  what3words: string;
  landmark: string;
  image: File | null;
  preview: string | null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&countrycodes=in`
    );
    const data = (await response.json()) as { display_name?: string };
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export function ComplaintForm({ onSuccess }: { onSuccess?: (complaint: IComplaint) => void }) {
  const router = useRouter();
  const { t } = useTranslation(["complaints", "common"]);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Indian State Languages State
  const [selectedLangCode, setSelectedLangCode] = useState<string>("en-IN");
  const [showAllLanguages, setShowAllLanguages] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string>("All");

  const activeLang = useMemo(() => {
    return (
      INDIAN_STATE_LANGUAGES.find((l) => l.code === selectedLangCode || l.key === selectedLangCode) ||
      INDIAN_STATE_LANGUAGES[0]
    );
  }, [selectedLangCode]);

  const filteredLanguages = useMemo(() => {
    return INDIAN_STATE_LANGUAGES.filter((l) => {
      const matchesZone = selectedZone === "All" || l.zone === selectedZone || l.zone === "Pan-India";
      const matchesQuery =
        langSearch.trim() === "" ||
        l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
        l.native.toLowerCase().includes(langSearch.toLowerCase()) ||
        l.state.toLowerCase().includes(langSearch.toLowerCase());
      return matchesZone && matchesQuery;
    });
  }, [selectedZone, langSearch]);

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    category: "pothole",
    lat: null,
    lng: null,
    address: "",
    what3words: "",
    landmark: "",
    image: null,
    preview: null,
  });

  const [locationMode, setLocationMode] = useState<LocationMode>("none");
  const [w3wInput, setW3wInput] = useState("");
  const [w3wResolving, setW3wResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<any | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [liveSpeechText, setLiveSpeechText] = useState<string>("");
  const [englishTranslation, setEnglishTranslation] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const [nearbyComplaints, setNearbyComplaints] = useState<IComplaint[]>([]);
  const [showNearbyModal, setShowNearbyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { location, loading: locating, getLocation } = useGeolocation();
  const submitComplaint = useComplaintStore((state) => state.submitComplaint);

  // Fill address and what3words from GPS fix
  useEffect(() => {
    async function fillGpsData(): Promise<void> {
      if (location) {
        const address = await reverseGeocode(location.lat, location.lng);
        const w3w = await convertTo3Words(location.lat, location.lng);
        setForm((current) => ({
          ...current,
          lat: location.lat,
          lng: location.lng,
          address,
          what3words: w3w,
        }));
        setW3wInput(w3w);
        setLocationMode("gps");
        toast.success(`GPS Location detected: ${w3w}`);
      }
    }
    void fillGpsData();
  }, [location]);

  // Trigger Gemini AI Assistant recommendations when title / description has meaningful text
  const fetchAiAssist = async () => {
    if (!form.title.trim() && !form.description.trim()) return;
    setAiAnalyzing(true);
    try {
      const res = await aiAPI.complaintAssist({
        title: form.title,
        description: form.description,
      });
      if (res.data?.success) {
        setAiInsight(res.data);
      }
    } catch {
      // Graceful fallback
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Voice Recording handler via Web MediaRecorder & Sarvam STT
  const startRecording = async () => {
    setError(null);
    setLiveSpeechText("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        await processAudioForTranscription(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start Browser Speech Recognition in parallel for selected Indian state language
      if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        try {
          const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = activeLang.code;
          rec.onresult = (event: any) => {
            let transcript = "";
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript + " ";
            }
            if (transcript.trim()) {
              setLiveSpeechText(transcript.trim());
            }
          };
          recognitionRef.current = rec;
          rec.start();
        } catch {}
      }

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn("Microphone access error:", err);
      toast.error("Microphone access denied or unavailable. Please type manually.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const processAudioForTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    const toastId = toast.loading(`Transcribing ${activeLang.label} audio via Sarvam AI Saaras...`);
    try {
      const audioFormData = new FormData();
      audioFormData.append("file", blob, "recording.webm");
      audioFormData.append("language", activeLang.code);

      let text = "";
      try {
        const res = await aiAPI.transcribe(audioFormData);
        if (res.data?.transcript && res.data.transcript.trim()) {
          text = res.data.transcript.trim();
        }
      } catch {}

      // If backend transcription is empty, use browser live speech recognition text
      if (!text && liveSpeechText.trim()) {
        text = liveSpeechText.trim();
      }

      toast.dismiss(toastId);

      if (text) {
        setVoiceTranscript(text);
        toast.success(`Voice transcript ready in ${activeLang.native}!`);

        if (!form.title.trim()) {
          const titleSnippet = text.slice(0, 70);
          setForm((prev) => ({
            ...prev,
            title: titleSnippet,
            description: prev.description ? `${prev.description}\n${text}` : text,
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            description: prev.description ? `${prev.description}\n${text}` : text,
          }));
        }
      } else {
        toast.error("Could not capture speech audio. Please type your complaint.");
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Speech transcription failed. Please type manually.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleTranslateDescription = async () => {
    const textToTranslate = form.description || form.title;
    if (!textToTranslate.trim()) return;

    setIsTranslating(true);
    const toastId = toast.loading(`Translating ${activeLang.label} to English via Sarvam AI Mayura...`);
    try {
      const res = await aiAPI.translate({
        text: textToTranslate,
        sourceLanguage: activeLang.code,
        targetLanguage: "en-IN",
      });
      toast.dismiss(toastId);

      if (res.data?.translatedText) {
        setEnglishTranslation(res.data.translatedText);
        toast.success("Translation complete!");
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Translation service unavailable.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Handle What3Words resolution
  const handleResolve3Words = async () => {
    if (!w3wInput.trim()) return;
    const formatted = format3Words(w3wInput);
    if (!isValid3Words(formatted)) {
      setError("Invalid what3words format (should be word.word.word)");
      toast.error("Invalid What3Words address");
      return;
    }

    setW3wResolving(true);
    setError(null);
    try {
      const coords = await convertToCoordinates(formatted);
      if (!coords) {
        setError("Could not locate that what3words address");
        toast.error("What3Words address not found");
        return;
      }
      const address = await reverseGeocode(coords.lat, coords.lng);
      setForm((current) => ({
        ...current,
        lat: coords.lat,
        lng: coords.lng,
        address,
        what3words: formatted,
      }));
      setW3wInput(formatted);
      toast.success(`Located: ${formatted}`);
    } catch {
      setError("Failed to resolve what3words address");
    } finally {
      setW3wResolving(false);
    }
  };

  // Handle Location from Leaflet Map Picker
  const handleMapLocationSelect = async (lat: number, lng: number) => {
    setError(null);
    const address = await reverseGeocode(lat, lng);
    const w3w = await convertTo3Words(lat, lng);
    setForm((current) => ({
      ...current,
      lat,
      lng,
      address,
      what3words: w3w,
    }));
    setW3wInput(w3w);
  };

  // Build Multipart Form Data
  const formData = useMemo(() => {
    const data = new FormData();
    data.append("title", form.title);
    data.append("description", form.description);
    data.append("category", form.category);
    data.append("language", activeLang.key);
    data.append("languageCode", activeLang.code);
    if (form.lat !== null) data.append("lat", String(form.lat));
    if (form.lng !== null) data.append("lng", String(form.lng));
    data.append("address", form.address);
    if (form.what3words) data.append("what3words", form.what3words);
    if (form.landmark) data.append("landmark", form.landmark);
    if (form.image) data.append("image", form.image);
    if (voiceTranscript) {
      data.append("voiceInput", "true");
      data.append("voiceTranscript", voiceTranscript);
    }
    return data;
  }, [form, activeLang, voiceTranscript]);

  // Handle Photo & Gemini Vision Categorization
  const handleImage = async (file: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed");
      toast.error("Invalid image format");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be under 8MB");
      toast.error("Image file too large");
      return;
    }

    const preview = URL.createObjectURL(file);
    setForm((current) => ({ ...current, image: file, preview }));
    setError(null);

    // Run AI Vision classification
    setAiAnalyzing(true);
    const toastId = toast.loading("AI Vision inspecting photo...");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const res = await aiAPI.categorizeImage({
            imageBase64: base64,
            mimeType: file.type,
          });

          if (res.data?.success) {
            const data = res.data;
            toast.dismiss(toastId);

            if (data.category && categories.includes(data.category)) {
              setForm((current) => ({
                ...current,
                category: data.category,
                title: current.title || data.suggestedTitle || `Reported ${getCategoryLabel(data.category)}`,
              }));
              toast.success(`AI Identified: ${getCategoryLabel(data.category)} (${Math.round((data.confidence || 0.9) * 100)}% match)`);
            }
          }
        } catch {
          toast.dismiss(toastId);
        } finally {
          setAiAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.dismiss(toastId);
      setAiAnalyzing(false);
    }
  };

  function handleNext(): void {
    setError(null);
    if (step === 1) {
      if (!form.title.trim()) {
        setError("Please enter a title for the issue");
        toast.error("Title is required");
        return;
      }
      if (!form.description.trim()) {
        setError("Please provide details in the description");
        toast.error("Description is required");
        return;
      }

      // Check duplicates
      try {
        void aiAPI.checkDuplicates({
          title: form.title,
          description: form.description,
          category: form.category,
          lat: form.lat ?? undefined,
          lng: form.lng ?? undefined,
        }).then((res) => {
          if (res.data?.isDuplicate && res.data.matches?.[0]) {
            setDuplicateWarning(res.data.matches[0]);
          }
        });
      } catch {}
    }

    if (step === 2) {
      if (!form.address.trim()) {
        setError("Please enter an address, use GPS, or pin on the map");
        toast.error("Location address is required");
        return;
      }
    }

    if (step === 3 && !form.image) {
      setError("Upload a photo of the issue");
      toast.error("Photo proof is required");
      return;
    }

    setStep((current) => Math.min(4, current + 1) as 1 | 2 | 3 | 4);
  }

  async function submitNow(): Promise<void> {
    setSubmitting(true);
    setError(null);
    const toastId = toast.loading(t("submitting", "Registering grievance..."));
    try {
      const complaint = await submitComplaint(formData);
      toast.dismiss(toastId);
      toast.success(`${t("success_msg", "Complaint registered successfully!")} #${complaint._id.slice(-6)}`);
      if (onSuccess) {
        onSuccess(complaint);
      } else {
        router.push(`/complaints/${complaint._id}`);
      }
    } catch (submitError: any) {
      toast.dismiss(toastId);
      const msg = submitError instanceof Error ? submitError.message : t("error_msg", "Submission failed");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNowForce(): Promise<void> {
    setSubmitting(true);
    setError(null);
    const toastId = toast.loading(t("submitting", "Registering grievance..."));
    try {
      const forceData = new FormData();
      forceData.append("title", form.title);
      forceData.append("description", form.description);
      forceData.append("category", form.category);
      forceData.append("language", activeLang.key);
      forceData.append("languageCode", activeLang.code);
      forceData.append("lat", String(form.lat || ""));
      forceData.append("lng", String(form.lng || ""));
      forceData.append("address", form.address);
      if (form.what3words) forceData.append("what3words", form.what3words);
      if (form.landmark) forceData.append("landmark", form.landmark);
      if (form.image) forceData.append("image", form.image);
      if (voiceTranscript) forceData.append("voiceTranscript", voiceTranscript);
      forceData.append("forceCreate", "true");

      const complaint = await submitComplaint(forceData);
      toast.dismiss(toastId);
      toast.success(`${t("success_msg", "Complaint registered successfully!")} #${complaint._id.slice(-6)}`);
      if (onSuccess) {
        onSuccess(complaint);
      } else {
        router.push(`/complaints/${complaint._id}`);
      }
    } catch (submitError: any) {
      toast.dismiss(toastId);
      const msg = submitError instanceof Error ? submitError.message : t("error_msg", "Submission failed");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviewSubmit(): Promise<void> {
    if (form.lat === null || form.lng === null) {
      await submitNow();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const nearby = await complaintsAPI.getNearby(form.lat, form.lng, 50);
      if (nearby.data.complaints?.length > 0) {
        setNearbyComplaints(nearby.data.complaints);
        setShowNearbyModal(true);
        setSubmitting(false);
        return;
      }
      await submitNow();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not verify nearby complaints");
      setSubmitting(false);
    }
  }

  const stepLabels = ["Details", "Location", "Photo Proof", "Review & Submit"];

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {stepLabels.map((label, i) => (
            <span key={label} className={i + 1 <= step ? "text-[#D95D0F]" : ""}>
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((item) => (
            <span
              key={item}
              className={`h-2 flex-1 rounded-full transition-all ${
                item <= step ? "bg-[#D95D0F]" : "bg-stone-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Duplicate Warning Alert */}
      {duplicateWarning && step === 1 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="size-4 text-amber-600" />
            <span>Similar Open Issue Detected Nearby</span>
          </div>
          <p className="text-slate-700">
            "{duplicateWarning.title}" was reported recently in this area.
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs font-bold border-amber-400 bg-white hover:bg-amber-100"
              onClick={() => {
                window.open(`/complaints/${duplicateWarning._id}`, "_blank");
              }}
            >
              View & Upvote
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-xs text-amber-800 hover:bg-amber-100"
              onClick={() => setDuplicateWarning(null)}
            >
              Proceed Anyway
            </Button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          <span className="font-bold text-red-600">!</span>
          {error}
        </div>
      )}

      {/* ── Step 1 : Details & Multilingual Input ── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Feature 6: Indian State Languages Filter & Selection Hub */}
          <div className="rounded-2xl border border-orange-200/90 bg-gradient-to-br from-stone-50 via-orange-50/25 to-stone-50 p-4 sm:p-5 space-y-4 shadow-xs">
            {/* Header & Active State Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#D95D0F] flex items-center justify-center shadow-xs shrink-0">
                  <Languages className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <span>Indian State Language Detection</span>
                    <span className="text-[10px] text-orange-600 font-bold bg-orange-100 px-2 py-0.5 rounded-full">
                      13+ Official Languages
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Voice &amp; text in your mother tongue · Auto-translated to English via Sarvam AI Mayura
                  </p>
                </div>
              </div>

              {/* Active Badge */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-orange-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500">Selected:</span>
                <span className="text-xs font-black text-[#D95D0F]">
                  {activeLang.native} ({activeLang.label})
                </span>
                <span className="text-[10px] text-slate-400 font-medium">· {activeLang.state}</span>
              </div>
            </div>

            {/* Quick Access Popular State Languages Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Quick Select Languages:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllLanguages((prev) => !prev)}
                  className="text-[11px] font-bold text-[#D95D0F] hover:underline flex items-center gap-1"
                >
                  <Filter className="size-3" />
                  {showAllLanguages ? "Collapse Filter View" : "Search All State Languages ▾"}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {INDIAN_STATE_LANGUAGES.slice(0, 7).map((lang) => {
                  const isSelected = activeLang.code === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setSelectedLangCode(lang.code)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-bold transition-all ${
                        isSelected
                          ? "bg-[#D95D0F] text-white shadow-sm ring-2 ring-orange-300"
                          : "bg-white text-slate-700 border border-stone-200 hover:bg-stone-100 shadow-xs"
                      }`}
                    >
                      <span className="text-xs">{lang.native}</span>
                      <span className="text-[10px] opacity-75">({lang.label})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expandable Searchable Filter Grid for All Indian State Languages */}
            {showAllLanguages && (
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
                {/* Search & Zone Filter Toolbar */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search state language e.g. Tamil, Punjabi, Odia, Gujarati, Malayalam..."
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-lg border-stone-300 bg-stone-50"
                    />
                  </div>

                  {/* Zone Filter Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {["All", "South", "North", "West", "East"].map((zone) => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => setSelectedZone(zone)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                          selectedZone === zone
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-stone-100 text-slate-600 hover:bg-stone-200"
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid of Indian Languages */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredLanguages.map((lang) => {
                    const isSelected = activeLang.code === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setSelectedLangCode(lang.code);
                        }}
                        className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-orange-50/90 border-[#D95D0F] shadow-xs"
                            : "bg-stone-50/70 border-stone-200/80 hover:bg-stone-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-slate-900">{lang.native}</span>
                          {isSelected && <CheckCircle2 className="size-3.5 text-[#D95D0F]" />}
                        </div>
                        <div className="mt-1">
                          <span className="text-xs font-bold text-slate-800 block">{lang.label}</span>
                          <span className="text-[10px] text-slate-400 font-medium truncate block">{lang.state}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Feature 7: Voice Speech-to-Text Input Section */}
          <div className="p-4 bg-gradient-to-br from-orange-50/70 via-amber-50/50 to-orange-50/30 rounded-2xl border border-orange-200 space-y-2.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#D95D0F] flex items-center justify-center shrink-0">
                  <Volume2 className="size-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block">
                    Voice Complaint Recording (Sarvam AI Saaras STT)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Recording in: <strong className="text-slate-800">{activeLang.native} ({activeLang.label})</strong>
                  </span>
                </div>
              </div>

              {!isRecording ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={startRecording}
                  disabled={isTranscribing}
                  className="text-xs font-black border-[#D95D0F] text-[#D95D0F] hover:bg-orange-500 hover:text-white transition-all shadow-xs h-9 px-4 rounded-xl"
                >
                  <Mic className="size-3.5 mr-1.5 animate-pulse" />
                  Speak in {activeLang.native} ({activeLang.label})
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={stopRecording}
                  className="text-xs font-black bg-red-600 hover:bg-red-700 text-white animate-pulse h-9 px-4 rounded-xl shadow-md"
                >
                  <MicOff className="size-3.5 mr-1.5" />
                  Stop Recording ({recordingSeconds}s)
                </Button>
              )}
            </div>

            {isTranscribing && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#D95D0F] pt-1">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Transcribing {activeLang.label} audio with Sarvam AI Saaras speech model...</span>
              </div>
            )}

            {voiceTranscript && (
              <div className="mt-2 p-3 bg-white rounded-xl border border-orange-200 text-xs text-slate-700 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-slate-900 font-bold">
                  <span className="flex items-center gap-1.5 text-[#D95D0F]">
                    <CheckCircle2 className="size-3.5" />
                    Recorded Transcript in {activeLang.native} ({activeLang.label}):
                  </span>
                  <Badge className="bg-orange-100 text-[#D95D0F] border-orange-200 text-[9px] font-mono">
                    Sarvam Saaras STT
                  </Badge>
                </div>
                <p className="italic text-slate-800 font-medium">"{voiceTranscript}"</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Complaint Title *
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm((cur) => ({ ...cur, title: e.target.value }))}
              onBlur={fetchAiAssist}
              placeholder={`e.g., Issue title in ${activeLang.label} or English...`}
              maxLength={200}
              className="border-stone-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm((cur) => ({ ...cur, category: e.target.value as ComplaintCategory }))}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none shadow-xs"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Detailed Description *
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((cur) => ({ ...cur, description: e.target.value }))}
              onBlur={fetchAiAssist}
              placeholder={`Describe the civic grievance in ${activeLang.label} (${activeLang.native}) or English...`}
              maxLength={2000}
              className="min-h-28 border-stone-300 rounded-xl"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-slate-400">{form.description.length}/2000</span>
              {activeLang.key !== "en" && form.description.trim().length > 0 && (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={handleTranslateDescription}
                  disabled={isTranslating}
                  className="text-[11px] font-bold text-[#D95D0F] border-orange-300 hover:bg-orange-50 gap-1.5 rounded-lg"
                >
                  {isTranslating ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3 text-orange-500" />
                  )}
                  Translate {activeLang.label} to English (Sarvam AI)
                </Button>
              )}
            </div>

            {/* Translation Result Card */}
            {englishTranslation && (
              <div className="mt-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-emerald-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    English Translation (Municipal Normalized for Ward Triage)
                  </span>
                  <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 font-mono">
                    Sarvam Mayura:v1
                  </Badge>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium italic">
                  "{englishTranslation}"
                </p>
              </div>
            )}
          </div>

          {/* Feature 5: AI Assistant Suggestion Box */}
          {aiInsight && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="size-4 text-purple-600" />
                  Gemini AI Civic Classification
                </span>
                <Badge className="bg-purple-600 text-white text-[10px]">
                  {Math.round((aiInsight.confidence || 0.9) * 100)}% Confidence
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 text-slate-700">
                <span><strong>Dept:</strong> {aiInsight.department}</span>
                <span>•</span>
                <span><strong>Severity:</strong> <span className="capitalize font-bold text-amber-800">{aiInsight.severity}</span></span>
              </div>
              {aiInsight.suggestedAction && (
                <p className="text-slate-600 italic">
                  Suggested Action: {aiInsight.suggestedAction}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2 : Location ── */}
      {step === 2 && (
        <div className="space-y-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Pinpoint Issue Location in India
          </p>

          {/* Location Modes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setLocationMode("gps");
                void getLocation();
              }}
              disabled={locating}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-bold transition ${
                locationMode === "gps"
                  ? "border-[#D95D0F] bg-orange-50/60 text-[#D95D0F]"
                  : "border-stone-200 text-slate-600 hover:border-orange-300"
              }`}
            >
              {locating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              Use GPS Fix
            </button>

            <button
              type="button"
              onClick={() => setLocationMode("map")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-bold transition ${
                locationMode === "map"
                  ? "border-[#D95D0F] bg-orange-50/60 text-[#D95D0F]"
                  : "border-stone-200 text-slate-600 hover:border-orange-300"
              }`}
            >
              <Layers className="size-4" />
              Pin on Map
            </button>

            <button
              type="button"
              onClick={() => setLocationMode("w3w")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-bold transition ${
                locationMode === "w3w"
                  ? "border-[#D95D0F] bg-orange-50/60 text-[#D95D0F]"
                  : "border-stone-200 text-slate-600 hover:border-orange-300"
              }`}
            >
              <span className="text-[#D95D0F] font-black text-sm">///</span>
              what3words
            </button>

            <button
              type="button"
              onClick={() => setLocationMode("manual")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-bold transition ${
                locationMode === "manual"
                  ? "border-[#D95D0F] bg-orange-50/60 text-[#D95D0F]"
                  : "border-stone-200 text-slate-600 hover:border-orange-300"
              }`}
            >
              <Pencil className="size-4" />
              Manual Address
            </button>
          </div>

          {/* Location Mode UI */}
          {locationMode === "map" && (
            <div className="space-y-2">
              <MapPicker
                value={form.lat && form.lng ? { lat: form.lat, lng: form.lng } : null}
                onChange={(loc) => {
                  setForm((cur) => ({
                    ...cur,
                    lat: loc.lat,
                    lng: loc.lng,
                    address: loc.address || cur.address,
                  }));
                  void convertTo3Words(loc.lat, loc.lng).then((w3w) => {
                    setForm((cur) => ({ ...cur, what3words: w3w }));
                    setW3wInput(w3w);
                  });
                }}
              />
              <p className="text-[11px] text-slate-500 text-center">
                Click anywhere on the map of India to set exact civic grievance coordinates.
              </p>
            </div>
          )}

          {locationMode === "w3w" && (
            <div className="space-y-2 p-4 bg-orange-50/40 rounded-xl border border-orange-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                what3words address (e.g. filled.count.soap)
              </label>
              <div className="flex gap-2">
                <Input
                  value={w3wInput}
                  onChange={(e) => setW3wInput(e.target.value)}
                  placeholder="/// word.word.word"
                  className="text-xs"
                />
                <Button
                  type="button"
                  onClick={handleResolve3Words}
                  disabled={w3wResolving}
                  className="bg-[#D95D0F] hover:bg-[#b84d0b] text-white text-xs font-bold"
                >
                  {w3wResolving ? <Loader2 className="size-3 animate-spin" /> : "Locate"}
                </Button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Address / Landmark *
            </label>
            <Input
              value={form.address}
              onChange={(e) => setForm((cur) => ({ ...cur, address: e.target.value }))}
              placeholder="e.g., Near Bus Stop, Station Road, Ward 4"
              className="border-stone-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nearby Landmark (Optional)
            </label>
            <Input
              value={form.landmark}
              onChange={(e) => setForm((cur) => ({ ...cur, landmark: e.target.value }))}
              placeholder="e.g., Opposite State Bank of India"
              className="border-stone-300"
            />
          </div>
        </div>
      )}

      {/* ── Step 3 : Photo Proof ── */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Upload Evidence Photo
          </p>

          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 rounded-2xl bg-stone-50 hover:bg-stone-100 transition cursor-pointer relative">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void handleImage(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {form.preview ? (
              <div className="space-y-3 text-center">
                <img
                  src={form.preview}
                  alt="Proof Preview"
                  className="h-48 w-auto max-w-full rounded-xl object-cover border border-stone-200 shadow-sm mx-auto"
                />
                <p className="text-xs font-semibold text-[#D95D0F]">
                  Click or tap to replace photo
                </p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#D95D0F] flex items-center justify-center mx-auto">
                  <Camera className="size-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Tap to take a photo or upload from gallery
                </p>
                <p className="text-xs text-slate-500">
                  JPEG, PNG, or WebP up to 8MB
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4 : Review & Submit ── */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Title</span>
              <span className="font-bold text-sm text-slate-900">{form.title}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Category</span>
              <span className="font-semibold text-slate-800 capitalize">{getCategoryLabel(form.category)}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Location</span>
              <span className="text-slate-800">{form.address}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Description</span>
              <p className="text-slate-700 whitespace-pre-line">{form.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((cur) => Math.max(1, cur - 1) as 1 | 2 | 3 | 4)}
            className="text-xs font-bold"
          >
            <ChevronLeft className="size-4 mr-1" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="bg-[#D95D0F] hover:bg-[#b84d0b] text-white text-xs font-bold px-6"
          >
            Next Step
            <ArrowRight className="size-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleReviewSubmit}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-8 shadow-md shadow-emerald-200"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <CheckCircle2 className="size-4 mr-1.5" />
            )}
            Submit Grievance
          </Button>
        )}
      </div>

      {/* Nearby Duplicate Verification Modal */}
      {showNearbyModal && (
        <NearbyComplaintsModal
          complaints={nearbyComplaints}
          onJoin={(id) => {
            window.open(`/complaints/${id}`, "_blank");
            setShowNearbyModal(false);
          }}
          onCreate={() => {
            setShowNearbyModal(false);
            void submitNowForce();
          }}
          onClose={() => setShowNearbyModal(false)}
        />
      )}
    </div>
  );
}

export default ComplaintForm;
