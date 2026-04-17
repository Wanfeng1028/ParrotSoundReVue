import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { exportDubbing, fetchDubbingOptions, generateDubbingDraft, previewDubbing } from "../api/dubbing";

interface VoiceOption {
  id: number;
  name: string;
  tag: string;
  avatar: string;
  sampleAudioUrl: string;
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
      currentVoice.value = response.data.voices[0] || null;
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
    handlePlay,
    handleExport,
    handleAIGenerate,
  };
}
