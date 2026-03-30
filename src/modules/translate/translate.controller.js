import { env } from "../../config/env.js";
import { translateTexts } from "../../services/translate.service.js";

async function translateBatch(req, res) {
  const target = typeof req.body?.target === "string" ? req.body.target : "en";
  const texts = Array.isArray(req.body?.texts) ? req.body.texts : [];

  if (!texts.length) {
    return res.status(400).json({ message: "texts array is required." });
  }

  try {
    const translations = await translateTexts({ texts, target });
    return res.json({
      provider: env.googleTranslateApiKey ? "google" : "fallback",
      target,
      translations,
    });
  } catch (error) {
    return res.json({
      provider: "fallback",
      target,
      translations: texts.map((text) => String(text ?? "")),
      message: "Translation service is unavailable right now.",
      details: error.message,
    });
  }
}

export { translateBatch };
