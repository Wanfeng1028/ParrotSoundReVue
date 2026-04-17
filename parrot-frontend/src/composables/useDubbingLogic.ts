import { computed, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { exportDubbing, fetchDubbingOptions, generateDubbingDraft, previewDubbing } from "../api/dubbing";

interface VoiceOption {
  id: number;
  name: string;
  tag: string;
  avatar: string;
  sampleAudioUrl: string;
}

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

  return result
    .replace(/零+/g, "零")
    .replace(/零$/g, "")
    .replace(/^一十/, "十");
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
  const settings = reactive({
    speed: 1,
    volume: 80,
    pitch: 55,
  });

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

  const playAudio = (url: string) => {
    const audio = new Audio(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}${url}`);
    audio.play().catch(() => {
      ElMessage.warning("音频无法播放，请稍后重试");
    });
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

    playAudio(currentVoice.value.sampleAudioUrl);
    ElMessage.success(`正在试听 ${currentVoice.value.name}`);
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
    const response = await previewDubbing({
      title: textContent.value.slice(0, 16) || "试听音频",
      text: textContent.value,
      voiceId: currentVoice.value.id,
      settings: currentSettings(),
    });
    playAudio(response.data.audioUrl);
    ElMessage.success("试听任务已生成");
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
    playAudio(response.data.audioUrl);
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
      textContent.value = response.data.content;
      ElMessage.success("AI 文稿生成成功");
    } finally {
      generating.value = false;
    }
  };

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
    loadOptions,
    selectVoice,
    selectEmotion,
    handleClearText,
    handleSmartSegment,
    handleLiaison,
    handleInsertPause,
    handlePolyphoneAssist,
    handleNumberNormalize,
    handlePhraseNormalize,
    previewCurrentVoice,
    cycleEmotion,
    handlePlay,
    handleExport,
    handleAIGenerate,
  };
}
