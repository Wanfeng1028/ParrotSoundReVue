const { env } = require("../config/env");

const modelLabelMap = {
  "gpt-4o-mini": "OpenAI · gpt-4o-mini",
  "gpt-4.1-mini": "OpenAI · gpt-4.1-mini",
  "claude-3-5-sonnet": "Anthropic · claude-3-5-sonnet",
  "gemini-2.5-flash": "Google · gemini-2.5-flash",
  "grok-2-latest": "xAI · grok-2-latest",
  "deepseek-chat": "DeepSeek · deepseek-chat",
  "deepseek-reasoner": "DeepSeek · deepseek-reasoner",
  "qwen-plus": "通义千问 · qwen-plus",
  "qwen-max": "通义千问 · qwen-max",
  "glm-4-plus": "智谱 · glm-4-plus",
};

const listModels = () =>
  env.ai.models.map((model) => ({
    id: model,
    provider: env.ai.provider,
    label: modelLabelMap[model] || model,
    isDefault: model === env.ai.defaultModel,
  }));

const ensureAiConfigured = () => {
  if (!env.ai.apiKey) {
    const error = new Error("AI service is not configured. Set AI_API_KEY to enable model calls.");
    error.status = 503;
    throw error;
  }
};

const chat = async ({ prompt, system, model }) => {
  ensureAiConfigured();
  const response = await fetch(`${env.ai.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.ai.apiKey}`,
    },
    body: JSON.stringify({
      model: model || env.ai.defaultModel,
      temperature: 0.7,
      messages: [
        { role: "system", content: system || "You are a concise Chinese writing assistant." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`AI request failed: ${body}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
};

const buildDraft = async ({ prompt, kind, model }) => {
  const systemMap = {
    dubbing: "You generate concise Chinese dubbing drafts. Return only the final script.",
    teaching: "You generate structured teaching narration in Chinese. Return only the final script.",
    voice: "You create short voice model descriptions in Chinese. Return only the final description.",
  };

  return chat({ prompt, system: systemMap[kind], model });
};

module.exports = { listModels, buildDraft };
