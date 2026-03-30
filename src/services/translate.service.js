import { env } from "../config/env.js";

const GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";

async function translateTexts({ texts, target }) {
  const normalizedTexts = Array.isArray(texts) ? texts.map((text) => String(text ?? "")) : [];

  if (!normalizedTexts.length) {
    return [];
  }

  if (target === "en" || !env.googleTranslateApiKey) {
    return normalizedTexts;
  }

  const response = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${env.googleTranslateApiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: normalizedTexts,
      target,
      format: "text",
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google Translate request failed: ${message}`);
  }

  const payload = await response.json();
  return payload.data?.translations?.map((item) => item.translatedText) || normalizedTexts;
}

export { translateTexts };
