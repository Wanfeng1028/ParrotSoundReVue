const { env } = require("../config/env");

const modelLabelMap = {
  "gpt-5.4": "OpenAI - gpt-5.4",
  "gpt-5.4-mini": "OpenAI - gpt-5.4-mini",
  "gpt-5.4-nano": "OpenAI - gpt-5.4-nano",
  "claude-opus-4-1": "Anthropic - claude-opus-4-1",
  "claude-opus-4-0": "Anthropic - claude-opus-4-0",
  "claude-sonnet-4-0": "Anthropic - claude-sonnet-4-0",
  "claude-3-7-sonnet-latest": "Anthropic - claude-3-7-sonnet-latest",
  "claude-3-5-sonnet-latest": "Anthropic - claude-3-5-sonnet-latest",
  "claude-3-5-haiku-latest": "Anthropic - claude-3-5-haiku-latest",
  "gemini-3-pro-preview": "Google - gemini-3-pro-preview",
  "gemini-3-flash-preview": "Google - gemini-3-flash-preview",
  "gemini-2.5-pro": "Google - gemini-2.5-pro",
  "gemini-2.5-flash": "Google - gemini-2.5-flash",
  "gemini-2.5-flash-lite": "Google - gemini-2.5-flash-lite",
  "grok-4.20-reasoning": "xAI - grok-4.20-reasoning",
  "grok-4.20-non-reasoning": "xAI - grok-4.20-non-reasoning",
  "grok-4-1-fast-reasoning": "xAI - grok-4-1-fast-reasoning",
  "grok-4-1-fast-non-reasoning": "xAI - grok-4-1-fast-non-reasoning",
  "deepseek-chat": "DeepSeek - deepseek-chat",
  "deepseek-reasoner": "DeepSeek - deepseek-reasoner",
  "qwen3-max": "Qwen - qwen3-max",
  "qwen3-max-preview": "Qwen - qwen3-max-preview",
  "qwen3.6-plus": "Qwen - qwen3.6-plus",
  "qwen3.5-plus": "Qwen - qwen3.5-plus",
  "qwen3.5-flash": "Qwen - qwen3.5-flash",
  "qwen-max": "Qwen - qwen-max",
  "qwen-max-latest": "Qwen - qwen-max-latest",
  "qwen-plus": "Qwen - qwen-plus",
  "qwen-plus-latest": "Qwen - qwen-plus-latest",
  "qwen-flash": "Qwen - qwen-flash",
  "qwen-turbo": "Qwen - qwen-turbo",
  "qwen-turbo-latest": "Qwen - qwen-turbo-latest",
  "glm-5.1": "Zhipu - glm-5.1",
  "glm-5": "Zhipu - glm-5",
  "glm-4.7": "Zhipu - glm-4.7",
  "glm-4.6": "Zhipu - glm-4.6",
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
