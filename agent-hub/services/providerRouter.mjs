import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Multi-Provider Key Pool Manager
 * Manages multiple keys per provider, tracks rotation, cooldowns, and quotas
 */
class KeyPool {
  constructor(providerName, rawKeys) {
    this.providerName = providerName;
    this.keys = (rawKeys || "")
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);
    this.currentIndex = 0;
    this.failedKeys = new Map(); // key -> cooldownUntil timestamp
  }

  getActiveKey() {
    if (this.keys.length === 0) return null;
    const now = Date.now();

    // Find the next non-cooldown key
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      const key = this.keys[idx];
      const cooldownUntil = this.failedKeys.get(key) || 0;
      if (now > cooldownUntil) {
        this.currentIndex = idx;
        return key;
      }
    }
    // If all keys are in cooldown, return the one with the earliest expiration
    return this.keys[this.currentIndex];
  }

  markKeyError(key, status) {
    // 429 = Rate limited (cooldown 60s), 401 = Invalid/Expired (cooldown 1 hr)
    const cooldownMs = status === 429 ? 60 * 1000 : 60 * 60 * 1000;
    this.failedKeys.set(key, Date.now() + cooldownMs);
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.warn(`[KeyPool ${this.providerName}] Key cooldown applied (${status}). Next key index: ${this.currentIndex}`);
  }

  hasAvailableKey() {
    return this.keys.length > 0;
  }
}

// Initialize key pools from environment
const pools = {
  gemini: new KeyPool("Gemini", `${process.env.GEMINI_API_KEY || ""},${process.env.GOOGLE_AI_API_KEY || ""}`),
  groq: new KeyPool("Groq", process.env.GROQ_API_KEY || ""),
  openai: new KeyPool("OpenAI", process.env.OPENAI_API_KEY || ""),
  deepseek: new KeyPool("DeepSeek", process.env.DEEPSEEK_API_KEY || ""),
  firefly: new KeyPool("AdobeFirefly", process.env.FIREFLY_CLIENT_ID || "")
};

/**
 * Provider Capability Registry
 */
export const CAPABILITIES = {
  TEXT_REASONING: "text_reasoning",
  VISION_ANALYSIS: "vision_analysis",
  IMAGE_GENERATION: "image_generation",
  IMAGE_EDITING: "image_editing"
};

export const PROVIDER_REGISTRY = [
  {
    providerId: "adobe-firefly",
    name: "Adobe Firefly Services (Embedded)",
    type: "EMBEDDED_OFFICIAL",
    capabilities: [CAPABILITIES.IMAGE_GENERATION, CAPABILITIES.IMAGE_EDITING],
    isAvailable: () => Boolean(process.env.FIREFLY_CLIENT_ID && process.env.FIREFLY_CLIENT_SECRET),
    priority: 1 // Highest priority when connected to bank Adobe account
  },
  {
    providerId: "groq",
    name: "Groq LPU (Llama-3 / GPT-OSS)",
    type: "FAST_LLM",
    capabilities: [CAPABILITIES.TEXT_REASONING],
    isAvailable: () => pools.groq.hasAvailableKey(),
    priority: 2
  },
  {
    providerId: "gemini",
    name: "Google Gemini 1.5 Flash / Pro",
    type: "MULTIMODAL",
    capabilities: [CAPABILITIES.TEXT_REASONING, CAPABILITIES.VISION_ANALYSIS],
    isAvailable: () => pools.gemini.hasAvailableKey(),
    priority: 3
  },
  {
    providerId: "openai",
    name: "OpenAI GPT-4o / DALL-E",
    type: "MULTIMODAL_IMAGE",
    capabilities: [CAPABILITIES.TEXT_REASONING, CAPABILITIES.VISION_ANALYSIS, CAPABILITIES.IMAGE_GENERATION],
    isAvailable: () => pools.openai.hasAvailableKey(),
    priority: 4
  },
  {
    providerId: "deepseek",
    name: "DeepSeek V3 / R1",
    type: "REASONING_LLM",
    capabilities: [CAPABILITIES.TEXT_REASONING],
    isAvailable: () => pools.deepseek.hasAvailableKey(),
    priority: 5
  }
];

/**
 * Execute Text Reasoning with automatic multi-key rotation and multi-provider fallback
 */
export async function executePromptWithFallback(prompt, systemInstruction = "Eres un asistente de ingeniería Martech BCP.") {
  const providers = ["groq", "gemini", "openai", "deepseek"];
  const logs = [];

  for (const prov of providers) {
    const pool = pools[prov];
    if (!pool || !pool.hasAvailableKey()) continue;

    const apiKey = pool.getActiveKey();
    if (!apiKey) continue;

    try {
      const startTime = Date.now();
      let responseText = null;

      if (prov === "groq") {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 1500
          })
        });

        if (!res.ok) {
          pool.markKeyError(apiKey, res.status);
          logs.push({ provider: prov, status: res.status, error: await res.text() });
          continue;
        }

        const data = await res.json();
        responseText = data.choices?.[0]?.message?.content;

      } else if (prov === "gemini") {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1500 }
          })
        });

        if (!res.ok) {
          pool.markKeyError(apiKey, res.status);
          logs.push({ provider: prov, status: res.status, error: await res.text() });
          continue;
        }

        const data = await res.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      } else if (prov === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: prompt }
            ],
            temperature: 0.2
          })
        });

        if (!res.ok) {
          pool.markKeyError(apiKey, res.status);
          logs.push({ provider: prov, status: res.status, error: await res.text() });
          continue;
        }

        const data = await res.json();
        responseText = data.choices?.[0]?.message?.content;
      }

      if (responseText) {
        return {
          success: true,
          provider: prov,
          latencyMs: Date.now() - startTime,
          content: responseText.trim(),
          fallbackLogs: logs
        };
      }

    } catch (err) {
      logs.push({ provider: prov, error: err.message });
      console.warn(`[ProviderRouter] Error with ${prov}: ${err.message}`);
    }
  }

  // Deterministic local fallback if all external models are offline
  return {
    success: false,
    provider: "local-fallback",
    latencyMs: 0,
    content: "Aviso de Contingencia: El router de IA ha operado en modo determinista local para proteger la gobernanza.",
    fallbackLogs: logs
  };
}

/**
 * Get Provider Status & Active Key Diagnostics
 */
export function getProviderStatus() {
  return PROVIDER_REGISTRY.map(p => {
    const pool = pools[p.providerId];
    return {
      providerId: p.providerId,
      name: p.name,
      type: p.type,
      capabilities: p.capabilities,
      isConfigured: pool ? pool.hasAvailableKey() : p.isAvailable(),
      keyCount: pool ? pool.keys.length : (p.isAvailable() ? 1 : 0),
      activeKeyIndex: pool ? pool.currentIndex : 0
    };
  });
}
