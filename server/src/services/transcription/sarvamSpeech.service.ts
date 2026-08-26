export interface TranscriptionResult {
  transcript: string;
  languageCode: string;
  success: boolean;
  error?: string;
  provider: "SARVAM_STT" | "FALLBACK";
}

const LANGUAGE_CODE_MAP: Record<string, string> = {
  hi: "hi-IN",
  "hi-IN": "hi-IN",
  hindi: "hi-IN",
  mr: "mr-IN",
  "mr-IN": "mr-IN",
  marathi: "mr-IN",
  en: "en-IN",
  "en-IN": "en-IN",
  english: "en-IN",
};

/**
 * Transcribe speech audio using Sarvam AI Saaras STT API
 * Accepts Audio Buffer or File and returns recognized text.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  languageCode = "hi-IN",
  mimeType = "audio/wav"
): Promise<TranscriptionResult> {
  const normalizedLang = LANGUAGE_CODE_MAP[languageCode.toLowerCase()] || "hi-IN";
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey) {
    return {
      transcript: "",
      languageCode: normalizedLang,
      success: false,
      error: "SARVAM_API_KEY is not configured on server. Please type your complaint manually.",
      provider: "FALLBACK",
    };
  }

  try {
    const formData = new FormData();
    const uint8 = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8], { type: mimeType });
    formData.append("file", blob, "recording.wav");
    formData.append("language_code", normalizedLang);
    formData.append("model", "saaras:v1");

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
      },
      body: formData,
    });

    if (response.ok) {
      const data = (await response.json()) as { transcript?: string };
      if (data.transcript) {
        return {
          transcript: data.transcript.trim(),
          languageCode: normalizedLang,
          success: true,
          provider: "SARVAM_STT",
        };
      }
    }

    const errText = await response.text();
    console.warn(`[Sarvam Speech] HTTP ${response.status}: ${errText}`);
    return {
      transcript: "",
      languageCode: normalizedLang,
      success: false,
      error: "Speech transcription service returned an error. Please try again or type your complaint.",
      provider: "FALLBACK",
    };
  } catch (error: any) {
    console.warn("[Sarvam Speech] Transcription failed:", error);
    return {
      transcript: "",
      languageCode: normalizedLang,
      success: false,
      error: error?.message || "Speech transcription failed. Please type your complaint.",
      provider: "FALLBACK",
    };
  }
}
