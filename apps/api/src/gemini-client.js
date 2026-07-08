import { config } from "./config.js";
import { HttpError } from "./http.js";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function isGeminiConfigured() {
  return Boolean(config.geminiApiKey);
}

export async function generateGeminiEmbedding(text, options = {}) {
  requireGeminiKey();
  const model = options.model || config.geminiEmbeddingModel;
  const dimensions = Number(options.dimensions || config.geminiEmbeddingDimensions || 1536);
  const payload = {
    content: {
      parts: [{ text: String(text || "").slice(0, 12000) }]
    },
    output_dimensionality: dimensions
  };

  const data = await geminiRequest(`/models/${encodeURIComponent(model)}:embedContent`, payload);
  const values = data?.embedding?.values || data?.embeddings?.[0]?.values;
  if (!Array.isArray(values) || values.length !== dimensions) {
    throw new HttpError(502, "GEMINI_EMBEDDING_INVALID", "Gemini embedding response is invalid", {
      expectedDimensions: dimensions,
      actualDimensions: Array.isArray(values) ? values.length : 0
    });
  }
  return values.map(Number);
}

export async function generateGeminiJson(prompt, schema, options = {}) {
  requireGeminiKey();
  const model = options.model || config.geminiStylistModel;
  const payload = {
    model,
    input: String(prompt || "").slice(0, 30000),
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema
    }
  };

  const data = await geminiRequest("/interactions", payload);
  const text = data?.output_text || data?.output?.[0]?.content?.[0]?.text || data?.text || "";
  if (!text) {
    throw new HttpError(502, "GEMINI_JSON_EMPTY", "Gemini returned an empty stylist response");
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new HttpError(502, "GEMINI_JSON_INVALID", "Gemini stylist response is not valid JSON", {
      parserMessage: error.message
    });
  }
}

export function vectorLiteral(values) {
  if (!Array.isArray(values) || !values.length) {
    throw new HttpError(500, "INVALID_VECTOR", "Embedding vector is empty");
  }
  return `[${values.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

async function geminiRequest(path, payload) {
  const response = await fetch(`${GEMINI_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": config.geminiApiKey
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  const data = text ? parseJson(text) : {};

  if (!response.ok) {
    throw new HttpError(response.status, "GEMINI_API_ERROR", "Gemini API request failed", {
      status: response.status,
      message: data?.error?.message || response.statusText
    });
  }

  return data;
}

function requireGeminiKey() {
  if (!config.geminiApiKey) {
    throw new HttpError(503, "GEMINI_API_KEY_REQUIRED", "Gemini API key is not configured");
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
