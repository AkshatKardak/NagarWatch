export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  success: boolean;
  provider: "SARVAM_AI" | "PASSTHROUGH";
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
 * Translate text using Sarvam AI Mayura Translation API
 * Fully resilient: never throws or blocks complaints if key is missing or service is down.
 */
export async function translateText(
  text: string,
  sourceLanguage = "hi-IN",
  targetLanguage = "en-IN"
): Promise<TranslationResult> {
  const cleanText = (text || "").trim();
  if (!cleanText) {
    return {
      originalText: "",
      translatedText: "",
      sourceLanguage,
      targetLanguage,
      success: true,
      provider: "PASSTHROUGH",
    };
  }

  const normalizedSource = LANGUAGE_CODE_MAP[sourceLanguage.toLowerCase()] || sourceLanguage;
  const normalizedTarget = LANGUAGE_CODE_MAP[targetLanguage.toLowerCase()] || targetLanguage;

  // If already target language, return as is
  if (normalizedSource === normalizedTarget) {
    return {
      originalText: cleanText,
      translatedText: cleanText,
      sourceLanguage: normalizedSource,
      targetLanguage: normalizedTarget,
      success: true,
      provider: "PASSTHROUGH",
    };
  }

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    console.info("[Sarvam Translation] SARVAM_API_KEY not configured, passing through original text.");
    return {
      originalText: cleanText,
      translatedText: cleanText,
      sourceLanguage: normalizedSource,
      targetLanguage: normalizedTarget,
      success: false,
      provider: "PASSTHROUGH",
    };
  }

  try {
    const response = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        input: cleanText,
        source_language_code: normalizedSource,
        target_language_code: normalizedTarget,
        speaker_gender: "Male",
        mode: "formal",
        model: "mayura:v1",
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as { translated_text?: string };
      if (data.translated_text) {
        return {
          originalText: cleanText,
          translatedText: data.translated_text.trim(),
          sourceLanguage: normalizedSource,
          targetLanguage: normalizedTarget,
          success: true,
          provider: "SARVAM_AI",
        };
      }
    }

    const errBody = await response.text();
    console.warn(`[Sarvam Translation] HTTP ${response.status}: ${errBody}`);
  } catch (error) {
    console.warn("[Sarvam Translation] Translation request failed, falling back gracefully:", error);
  }

  // Graceful fallback: return original text
  return {
    originalText: cleanText,
    translatedText: cleanText,
    sourceLanguage: normalizedSource,
    targetLanguage: normalizedTarget,
    success: false,
    provider: "PASSTHROUGH",
  };
}
