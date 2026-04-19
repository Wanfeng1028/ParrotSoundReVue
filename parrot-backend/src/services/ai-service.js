const { env } = require("../config/env");

const modelLabelMap = {
  "gpt-5.2": "OpenAI - gpt-5.2",
  "gpt-5.2-pro": "OpenAI - gpt-5.2-pro",
  "gpt-5.2-codex": "OpenAI - gpt-5.2-codex",
  "gpt-5": "OpenAI - gpt-5",
  "gpt-5-mini": "OpenAI - gpt-5-mini",
  "gpt-5-nano": "OpenAI - gpt-5-nano",
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

const buildLocalDraft = ({ prompt, kind }) => {
  const normalizedPrompt = String(prompt || "").replace(/\s+/g, " ").trim() || "本次主题";

  if (kind === "teaching") {
    return `同学们大家好，今天我们围绕“${normalizedPrompt}”展开学习。\n首先，我们会用一个清晰的生活化场景引入主题，帮助大家快速建立整体印象。\n接着，我们按“概念理解、关键步骤、实际应用”三个部分逐步拆解重点内容。\n最后，我会带大家完成一次简短总结，方便课后复习和再次回看。`;
  }

  if (kind === "voice") {
    return `这是一款适合“${normalizedPrompt}”场景的中文音色，整体听感清晰自然，节奏稳定，适合演示、讲解和旁白内容。`;
  }

  return `大家好，欢迎收听今天的内容。接下来，我们将围绕“${normalizedPrompt}”展开讲解。\n这段文稿会保持自然、清晰、便于朗读的节奏，适合直接进入智能配音流程。\n你可以根据页面上的音色、情感和语速设置，快速调整成更符合业务场景的表达风格。\n如果需要导出音频，也可以在试听确认后直接完成。`;
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

  if (!env.ai.apiKey) {
    return buildLocalDraft({ prompt, kind });
  }

  return chat({ prompt, system: systemMap[kind], model });
};

module.exports = { listModels, buildDraft };
