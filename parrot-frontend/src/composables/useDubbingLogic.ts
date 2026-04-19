import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { exportDubbing, fetchDubbingOptions, generateDubbingDraft, previewDubbing } from "../api/dubbing";
import { waitForTask } from "../api/tasks";
import { downloadMediaUrl, resolveMediaUrl } from "../utils/media";

interface VoiceOption {
  id: number;
  name: string;
  tag: string;
  avatar: string;
  sampleAudioUrl: string;
}

type SpeechVoiceMatcher = {
  male: string[];
  female: string[];
};

const polyphoneDictionary = [
  { keyword: "重庆", tip: "建议读作 chong qing" },
  { keyword: "银行行长", tip: "第二个“行”建议读作 hang" },
  { keyword: "重要", tip: "“重”建议读作 zhong" },
  { keyword: "长大", tip: "“长”建议读作 zhang" },
  { keyword: "音乐乐章", tip: "“乐”建议根据语境读作 yue" },
];

const acronymDictionary: Array<[RegExp, string]> = [
  [/\bgpt\b/gi, "GPT"],
  [/\bai\b/gi, "AI"],
  [/\bppt\b/gi, "PPT"],
  [/\bapi\b/gi, "API"],
  [/\btts\b/gi, "TTS"],
];

const chineseDigits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;
const unitMap = ["", "十", "百", "千"] as const;
const exampleDubbingText = `大家好，欢迎来到 ParrotSound 智能配音台。今天我们用一段完整的示例文稿，快速体验从文本处理、音色选择到试听导出的整个流程。你可以先点击右侧音色卡片切换声音，再试试智能分段、数字转换和情感切换，最后导出音频并到音频记录页查看结果。`;
const speechVoiceMatcher: SpeechVoiceMatcher = {
  male: ["yunxi", "yunjian", "junxi", "kangkang", "david", "mark", "boy", "male"],
  female: ["xiaoxiao", "xiaoyi", "xiaomo", "xiaorui", "huihui", "tracy", "aria", "girl", "female"],
};
const dubbingDraftStorageKey = "parrot:dubbing:draft";

function convertIntegerToChinese(value: number) {
  if (value === 0) {
    return chineseDigits[0];
  }

  const digits = String(value).split("").map(Number);
  let result = "";

  digits.forEach((digit, index) => {
    const unitIndex = digits.length - index - 1;
    if (digit === 0) {
      if (!result.endsWith(chineseDigits[0]) && unitIndex !== 0) {
        result += chineseDigits[0];
      }
      return;
    }
    result += `${chineseDigits[digit] ?? String(digit)}${unitMap[unitIndex] ?? ""}`;
  });

  return result.replace(/零+/g, "零").replace(/零$/g, "").replace(/^一十/, "十");
}

function convertNumberToChinese(raw: string) {
  const value = Number(raw);
  if (Number.isNaN(value)) {
    return raw;
  }

  if (raw.includes(".")) {
    const [integerPart, decimalPart = ""] = raw.split(".");
    const integerText = convertIntegerToChinese(Number(integerPart));
    const decimalText = decimalPart
      .split("")
      .map((digit) => chineseDigits[Number(digit)] || digit)
      .join("");
    return `${integerText}点${decimalText}`;
  }

  return convertIntegerToChinese(value);
}

export function useDubbingLogic() {
  const textContent = ref("");
  const aiInput = ref("");
  const searchText = ref("");
  const loading = ref(false);
  const generating = ref(false);
  const availableModels = ref<Array<{ id: string; label: string }>>([]);
  const selectedModel = ref("");
  const voiceList = ref<VoiceOption[]>([]);
  const currentVoice = ref<VoiceOption | null>(null);
  const emotionList = ref(["默认"]);
  const currentEmotion = ref("默认");
  const activePreviewVoiceId = ref<number | null>(null);
  const isPreviewPlaying = ref(false);
  const speakingTextPreview = ref(false);
  const activePreviewMode = ref<"audio" | "speech" | null>(null);
  const speechPreviewKind = ref<"text" | "voice" | null>(null);
  const speechVoices = ref<SpeechSynthesisVoice[]>([]);
  const settings = reactive({
    speed: 1,
    volume: 80,
    pitch: 55,
  });
  let previewAudio: HTMLAudioElement | null = null;

  const getPlaybackRate = () => Math.min(2, Math.max(0.5, settings.speed));

  const restoreDraft = () => {
    const raw = sessionStorage.getItem(dubbingDraftStorageKey);
    if (!raw) {
      return;
    }

    try {
      const draft = JSON.parse(raw) as {
        textContent?: string;
        aiInput?: string;
        searchText?: string;
        selectedModel?: string;
        currentEmotion?: string;
        selectedVoiceId?: number | null;
        settings?: Partial<typeof settings>;
      };

      textContent.value = draft.textContent || "";
      aiInput.value = draft.aiInput || "";
      searchText.value = draft.searchText || "";
      selectedModel.value = draft.selectedModel || "";
      currentEmotion.value = draft.currentEmotion || currentEmotion.value;
      settings.speed = draft.settings?.speed ?? settings.speed;
      settings.volume = draft.settings?.volume ?? settings.volume;
      settings.pitch = draft.settings?.pitch ?? settings.pitch;

      if (typeof draft.selectedVoiceId === "number") {
        const matchedVoice = voiceList.value.find((item) => item.id === draft.selectedVoiceId);
        if (matchedVoice) {
          currentVoice.value = matchedVoice;
        }
      }
    } catch {
      sessionStorage.removeItem(dubbingDraftStorageKey);
    }
  };

  const persistDraft = () => {
    sessionStorage.setItem(
      dubbingDraftStorageKey,
      JSON.stringify({
        textContent: textContent.value,
        aiInput: aiInput.value,
        searchText: searchText.value,
        selectedModel: selectedModel.value,
        currentEmotion: currentEmotion.value,
        selectedVoiceId: currentVoice.value?.id ?? null,
        settings: {
          speed: settings.speed,
          volume: settings.volume,
          pitch: settings.pitch,
        },
      }),
    );
  };

  const filteredVoiceList = computed(() =>
    voiceList.value.filter((voice) =>
      `${voice.name}${voice.tag}`.toLowerCase().includes(searchText.value.toLowerCase()),
    ),
  );

  const loadOptions = async () => {
    loading.value = true;
    try {
      const response = await fetchDubbingOptions();
      voiceList.value = response.data.voices;
      const preferredVoiceId = Number(localStorage.getItem("preferredCommunityVoiceId") || 0);
      currentVoice.value =
        response.data.voices.find((item) => item.id === preferredVoiceId) ||
        response.data.voices[0] ||
        null;
      emotionList.value = response.data.emotions;
      currentEmotion.value = response.data.emotions[0] || "默认";
      availableModels.value = response.data.models.map((item) => ({ id: item.id, label: item.label }));
      selectedModel.value = response.data.currentModel?.id || response.data.models[0]?.id || "";
      restoreDraft();
    } finally {
      loading.value = false;
    }
  };

  const selectVoice = (voice: VoiceOption) => {
    currentVoice.value = voice;
  };

  const selectEmotion = (emotion: string) => {
    currentEmotion.value = emotion;
  };

  const currentSettings = () => ({
    volume: settings.volume,
    pitch: settings.pitch,
    speed: settings.speed,
    emotion: currentEmotion.value,
  });

  const normalizeVoiceName = (voice: SpeechSynthesisVoice) =>
    `${voice.name} ${voice.lang} ${voice.voiceURI}`.toLowerCase();

  const guessVoiceTone = (voice: VoiceOption) => {
    const normalized = `${voice.name} ${voice.tag}`.toLowerCase();
    return normalized.includes("女") ? "female" : "male";
  };

  const pickSpeechSynthesisVoice = () => {
    return pickSpeechSynthesisVoiceFor(currentVoice.value);
  };

  const pickSpeechSynthesisVoiceFor = (voiceOption: VoiceOption | null) => {
    if (!("speechSynthesis" in window) || !voiceOption) {
      return null;
    }

    const voices = speechVoices.value.length ? speechVoices.value : window.speechSynthesis.getVoices();
    if (!voices.length) {
      return null;
    }

    const chineseVoices = voices.filter((voice) => /zh|cmn/i.test(voice.lang) || /chinese/i.test(voice.name));
    const pool = chineseVoices.length ? chineseVoices : voices;
    const tone = guessVoiceTone(voiceOption);
    const matcher = speechVoiceMatcher[tone];

    const preferred = pool.find((voice) => matcher.some((keyword) => normalizeVoiceName(voice).includes(keyword)));
    return preferred || pool[0] || null;
  };

  const isPlaceholderAudioUrl = (url: string) =>
    url.includes("/api/media/demo-audio") ||
    url.includes("/api/media/voice-chaowen") ||
    url.includes("/api/media/voice-xiaoya");

  const clearPreviewState = () => {
    activePreviewVoiceId.value = null;
    isPreviewPlaying.value = false;
    activePreviewMode.value = null;
    speechPreviewKind.value = null;
  };

  const stopPreviewAudio = () => {
    if (!previewAudio) {
      if (activePreviewMode.value === "audio") {
        clearPreviewState();
      }
      return;
    }

    previewAudio.pause();
    previewAudio.currentTime = 0;
    previewAudio.onended = null;
    previewAudio = null;
    clearPreviewState();
  };

  const stopSpeechPreview = () => {
    if (!("speechSynthesis" in window)) {
      speakingTextPreview.value = false;
      if (activePreviewMode.value === "speech") {
        clearPreviewState();
      }
      return;
    }

    window.speechSynthesis.cancel();
    speakingTextPreview.value = false;
    if (activePreviewMode.value === "speech") {
      clearPreviewState();
      return;
    }
    speechPreviewKind.value = null;
  };

  const togglePreviewAudio = (url: string, voiceId?: number | null) => {
    const targetUrl = resolveMediaUrl(url);
    if (!targetUrl) {
      ElMessage.warning("音频地址无效，请稍后重试");
      return "idle" as const;
    }

    if (previewAudio && previewAudio.src === targetUrl) {
      if (!previewAudio.paused) {
        previewAudio.pause();
        isPreviewPlaying.value = false;
        return "paused" as const;
      }

      previewAudio.playbackRate = getPlaybackRate();
      previewAudio.play().then(() => {
        isPreviewPlaying.value = true;
      }).catch(() => {
        ElMessage.warning("音频无法播放，请稍后重试");
      });
      return "resumed" as const;
    }

    stopPreviewAudio();
    previewAudio = new Audio(targetUrl);
    previewAudio.playbackRate = getPlaybackRate();
    activePreviewVoiceId.value = voiceId ?? null;
    activePreviewMode.value = "audio";
    previewAudio.onended = () => {
      stopPreviewAudio();
    };
    previewAudio.play().then(() => {
      isPreviewPlaying.value = true;
    }).catch(() => {
      stopPreviewAudio();
      ElMessage.warning("音频无法播放，请稍后重试");
    });
    return "started" as const;
  };

  const toggleVoiceSpeechPreview = (voice: VoiceOption) => {
    if (!("speechSynthesis" in window)) {
      ElMessage.warning("当前浏览器不支持音色试听朗读");
      return "idle" as const;
    }

    const speechVoice = pickSpeechSynthesisVoiceFor(voice);

    const sameSpeechPreview = activePreviewMode.value === "speech" && activePreviewVoiceId.value === voice.id;
    if (sameSpeechPreview) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        isPreviewPlaying.value = true;
        return "resumed" as const;
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        isPreviewPlaying.value = false;
        return "paused" as const;
      }
    }

    stopPreviewAudio();
    stopSpeechPreview();

    const utterance = new SpeechSynthesisUtterance(textContent.value.trim() || exampleDubbingText);
    if (speechVoice) {
      utterance.voice = speechVoice;
      utterance.lang = speechVoice.lang || "zh-CN";
    } else {
      utterance.lang = "zh-CN";
    }
    utterance.rate = getPlaybackRate();
    utterance.pitch = Math.min(2, Math.max(0, settings.pitch / 50));
    utterance.volume = Math.min(1, Math.max(0, settings.volume / 100));
    utterance.onend = () => {
      if (activePreviewMode.value === "speech" && activePreviewVoiceId.value === voice.id) {
        clearPreviewState();
      }
    };
    utterance.onerror = () => {
      if (activePreviewMode.value === "speech" && activePreviewVoiceId.value === voice.id) {
        clearPreviewState();
      }
      ElMessage.warning("音色试听失败，请稍后重试");
    };

    activePreviewVoiceId.value = voice.id;
    activePreviewMode.value = "speech";
    speechPreviewKind.value = "voice";
    isPreviewPlaying.value = true;
    window.speechSynthesis.speak(utterance);
    return "started" as const;
  };

  const playTextPreview = () => {
    if (!("speechSynthesis" in window)) {
      ElMessage.warning("当前浏览器不支持文稿试听，请改用右侧样音试听");
      return false;
    }

    const voice = pickSpeechSynthesisVoice();

    stopPreviewAudio();
    stopSpeechPreview();

    const utterance = new SpeechSynthesisUtterance(textContent.value.trim());
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "zh-CN";
    } else {
      utterance.lang = "zh-CN";
    }
    utterance.rate = getPlaybackRate();
    utterance.pitch = Math.min(2, Math.max(0, settings.pitch / 50));
    utterance.volume = Math.min(1, Math.max(0, settings.volume / 100));
    utterance.onend = () => {
      speakingTextPreview.value = false;
    };
    utterance.onerror = () => {
      speakingTextPreview.value = false;
      ElMessage.warning("文稿试听失败，请稍后重试");
    };

    speakingTextPreview.value = true;
    speechPreviewKind.value = "text";
    window.speechSynthesis.speak(utterance);
    return true;
  };

  const ensureText = (actionLabel: string) => {
    if (textContent.value.trim()) {
      return true;
    }
    ElMessage.warning(`请先输入文案后再${actionLabel}`);
    return false;
  };

  const handleClearText = () => {
    if (!textContent.value) {
      ElMessage.info("当前文案已经是空的");
      return;
    }
    textContent.value = "";
    ElMessage.success("文案已清空");
  };

  const handleFillExample = () => {
    textContent.value = exampleDubbingText;
    aiInput.value = "生成一段适合产品演示的中文配音稿";
    ElMessage.success("已填入示例文案，可直接测试配音流程");
  };

  const handleSmartSegment = () => {
    if (!ensureText("智能分段")) {
      return;
    }

    textContent.value = textContent.value
      .replace(/\r/g, "")
      .replace(/([。！？!?；;])/g, "$1\n")
      .replace(/，(?=[^\n])/g, "，")
      .replace(/\n{2,}/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");

    ElMessage.success("已按语句完成智能分段");
  };

  const handleLiaison = () => {
    if (!ensureText("处理连读")) {
      return;
    }

    textContent.value = textContent.value
      .replace(/([^\s])\s+([^\s])/g, "$1$2")
      .replace(/\n+(?=[^\n])/g, "，")
      .replace(/，{2,}/g, "，")
      .replace(/。(?=[^\n])/g, "。");

    ElMessage.success("已将文案调整为更适合连读的节奏");
  };

  const handleInsertPause = async () => {
    if (!ensureText("设置停顿")) {
      return;
    }

    try {
      const { value } = await ElMessageBox.prompt(
        "输入要在其后加入停顿的关键词，留空则默认在文案末尾追加停顿。",
        "设置停顿",
        {
          confirmButtonText: "插入停顿",
          cancelButtonText: "取消",
          inputPlaceholder: "例如：课程目标",
        },
      );

      const keyword = value.trim();

      if (!keyword) {
        textContent.value = `${textContent.value.replace(/[，。！？!?、\s]+$/g, "")}……`;
        ElMessage.success("已在文案末尾追加停顿");
        return;
      }

      if (!textContent.value.includes(keyword)) {
        ElMessage.warning("未找到该关键词，未插入停顿");
        return;
      }

      textContent.value = textContent.value.replace(keyword, `${keyword}，`);
      ElMessage.success(`已在“${keyword}”后插入停顿`);
    } catch {
      // User cancelled the dialog.
    }
  };

  const handlePolyphoneAssist = async () => {
    if (!ensureText("检查多音字")) {
      return;
    }

    const hits = polyphoneDictionary.filter((item) => textContent.value.includes(item.keyword));

    if (!hits.length) {
      ElMessage.success("未检测到常见多音字短语");
      return;
    }

    await ElMessageBox.alert(
      hits.map((item) => `${item.keyword}：${item.tip}`).join("<br/>"),
      "多音字提示",
      {
        confirmButtonText: "知道了",
        dangerouslyUseHTMLString: true,
      },
    );
  };

  const handleNumberNormalize = () => {
    if (!ensureText("转换数字")) {
      return;
    }

    const nextContent = textContent.value.replace(/\d+(\.\d+)?/g, (match: string) => convertNumberToChinese(match));

    if (nextContent === textContent.value) {
      ElMessage.info("当前文案中没有可转换的数字");
      return;
    }

    textContent.value = nextContent;
    ElMessage.success("已将数字转换为中文读法");
  };

  const handlePhraseNormalize = () => {
    if (!ensureText("规范单词词组")) {
      return;
    }

    let nextContent = textContent.value
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n");

    acronymDictionary.forEach(([pattern, replacement]) => {
      nextContent = nextContent.replace(pattern, replacement);
    });

    if (nextContent === textContent.value) {
      ElMessage.info("当前文案已经比较规范");
      return;
    }

    textContent.value = nextContent;
    ElMessage.success("已完成单词词组规范化");
  };

  const previewCurrentVoice = () => {
    if (!currentVoice.value) {
      ElMessage.warning("请先选择一个声音");
      return;
    }

    const state = isPlaceholderAudioUrl(currentVoice.value.sampleAudioUrl)
      ? toggleVoiceSpeechPreview(currentVoice.value)
      : (() => {
          stopSpeechPreview();
          return togglePreviewAudio(currentVoice.value!.sampleAudioUrl, currentVoice.value!.id);
        })();
    if (state === "started" || state === "resumed") {
      ElMessage.success(`正在试听 ${currentVoice.value.name}`);
    } else if (state === "paused") {
      ElMessage.success(`已暂停 ${currentVoice.value.name}`);
    }
  };

  const previewVoiceSample = (voice: VoiceOption) => {
    currentVoice.value = voice;
    const state = isPlaceholderAudioUrl(voice.sampleAudioUrl)
      ? toggleVoiceSpeechPreview(voice)
      : (() => {
          stopSpeechPreview();
          return togglePreviewAudio(voice.sampleAudioUrl, voice.id);
        })();
    if (state === "started" || state === "resumed") {
      ElMessage.success(`正在试听 ${voice.name}`);
    } else if (state === "paused") {
      ElMessage.success(`已暂停 ${voice.name}`);
    }
  };

  const cycleEmotion = () => {
    if (!emotionList.value.length) {
      return;
    }

    const currentIndex = emotionList.value.findIndex((emotion) => emotion === currentEmotion.value);
    const nextIndex = currentIndex === -1 || currentIndex === emotionList.value.length - 1 ? 0 : currentIndex + 1;
    currentEmotion.value = emotionList.value[nextIndex] || emotionList.value[0] || "默认";
    ElMessage.success(`已切换为${currentEmotion.value}情感`);
  };

  const handlePlay = async () => {
    if (!textContent.value || !currentVoice.value) {
      ElMessage.warning("请输入文案并选择声音");
      return;
    }

    if (speakingTextPreview.value) {
      stopSpeechPreview();
      ElMessage.success("已暂停文稿试听");
      return;
    }

    if (playTextPreview()) {
      ElMessage.success(`正在用 ${currentVoice.value.name} 对当前文稿进行试听`);
      return;
    }

    const response = await previewDubbing({
      title: textContent.value.slice(0, 16) || "试听音频",
      text: textContent.value,
      voiceId: currentVoice.value.id,
      settings: currentSettings(),
    });
    const task = await waitForTask<{ audioUrl: string }>(response.data.taskId);
    if (task.result && typeof task.result === "object" && "audioUrl" in task.result) {
      stopPreviewAudio();
      previewAudio = new Audio(resolveMediaUrl(String(task.result.audioUrl)));
      previewAudio.onended = () => {
        stopPreviewAudio();
      };
      previewAudio.play().catch(() => {
        stopPreviewAudio();
        ElMessage.warning("音频无法播放，请稍后重试");
      });
    }
    ElMessage.warning("当前环境暂未接入真实文稿合成，已回退到固定样音试听");
  };

  const handleExport = async () => {
    if (!textContent.value || !currentVoice.value) {
      ElMessage.warning("请输入文案并选择声音");
      return;
    }
    const response = await exportDubbing({
      title: textContent.value.slice(0, 16) || "导出音频",
      text: textContent.value,
      voiceId: currentVoice.value.id,
      settings: currentSettings(),
    });
    const task = await waitForTask<{ audioUrl: string }>(response.data.taskId);
    if (task.result && typeof task.result === "object" && "audioUrl" in task.result) {
      const filename = `${(textContent.value.slice(0, 12) || "导出音频").replace(/[\\/:*?"<>|]/g, "_")}.mp3`;
      downloadMediaUrl(String(task.result.audioUrl), filename);
    }
    ElMessage.success("导出成功，已同步到音频记录");
  };

  const handleAIGenerate = async () => {
    if (!aiInput.value) {
      ElMessage.warning("请输入创作需求");
      return;
    }
    generating.value = true;
    try {
      const response = await generateDubbingDraft({
        prompt: aiInput.value,
        model: selectedModel.value,
      });
      const task = await waitForTask<{ content: string }>(response.data.taskId);
      textContent.value = task.result?.content || "";
      ElMessage.success("AI 文稿生成成功");
    } finally {
      generating.value = false;
    }
  };

  const isVoicePreviewActive = (voiceId: number) => activePreviewVoiceId.value === voiceId && isPreviewPlaying.value;

  const refreshSpeechVoices = () => {
    if (!("speechSynthesis" in window)) {
      speechVoices.value = [];
      return;
    }
    speechVoices.value = window.speechSynthesis.getVoices();
  };

  const handleSpeechVoicesChanged = () => {
    refreshSpeechVoices();
  };

  onMounted(() => {
    if (!("speechSynthesis" in window)) {
      return;
    }
    const speechEngine = window.speechSynthesis as any;
    refreshSpeechVoices();
    window.setTimeout(refreshSpeechVoices, 200);
    window.setTimeout(refreshSpeechVoices, 800);
    if (typeof speechEngine.addEventListener === "function") {
      speechEngine.addEventListener("voiceschanged", handleSpeechVoicesChanged);
    } else {
      speechEngine.onvoiceschanged = handleSpeechVoicesChanged;
    }
  });

  onBeforeUnmount(() => {
    stopPreviewAudio();
    stopSpeechPreview();
    if ("speechSynthesis" in window) {
      const speechEngine = window.speechSynthesis as any;
      if (typeof speechEngine.removeEventListener === "function") {
        speechEngine.removeEventListener("voiceschanged", handleSpeechVoicesChanged);
      } else {
        speechEngine.onvoiceschanged = null;
      }
    }
  });

  watch(
    [
      textContent,
      aiInput,
      searchText,
      selectedModel,
      currentEmotion,
      currentVoice,
      () => settings.speed,
      () => settings.volume,
      () => settings.pitch,
    ],
    () => {
      persistDraft();
    },
    { deep: true },
  );

  watch(
    () => settings.speed,
    () => {
      if (previewAudio) {
        previewAudio.playbackRate = getPlaybackRate();
      }

      if (!("speechSynthesis" in window) || !window.speechSynthesis.speaking) {
        return;
      }

      if (speechPreviewKind.value === "text" && speakingTextPreview.value) {
        stopSpeechPreview();
        window.setTimeout(() => {
          if (textContent.value.trim()) {
            playTextPreview();
          }
        }, 0);
        return;
      }

      if (speechPreviewKind.value === "voice" && activePreviewMode.value === "speech" && activePreviewVoiceId.value) {
        const targetVoice = voiceList.value.find((item) => item.id === activePreviewVoiceId.value) || currentVoice.value;
        stopSpeechPreview();
        window.setTimeout(() => {
          if (targetVoice) {
            toggleVoiceSpeechPreview(targetVoice);
          }
        }, 0);
      }
    },
  );

  return {
    loading,
    generating,
    textContent,
    aiInput,
    searchText,
    currentVoice,
    voiceList: filteredVoiceList,
    settings,
    emotionList,
    currentEmotion,
    availableModels,
    selectedModel,
    activePreviewVoiceId,
    isPreviewPlaying,
    speakingTextPreview,
    loadOptions,
    selectVoice,
    selectEmotion,
    handleClearText,
    handleFillExample,
    handleSmartSegment,
    handleLiaison,
    handleInsertPause,
    handlePolyphoneAssist,
    handleNumberNormalize,
    handlePhraseNormalize,
    previewCurrentVoice,
    previewVoiceSample,
    isVoicePreviewActive,
    cycleEmotion,
    handlePlay,
    handleExport,
    handleAIGenerate,
  };
}
