import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { createVoice, deleteVoice, fetchMyVoices, generateVoiceDescription, updateVoiceVisibility } from "../api/voices";
import type { VoiceModel } from "../types";

export function useVoiceCloneLogic() {
  const loading = ref(false);
  const aiLoading = ref(false);
  const uploadMode = ref<"select" | "record">("select");
  const recordTimer = ref("00 : 00");
  const isRecording = ref(false);
  const myVoices = ref<VoiceModel[]>([]);
  const selectedFiles = reactive<{ cover: File | null; sample: File | null }>({
    cover: null,
    sample: null,
  });
  const formData = reactive({
    name: "",
    description: "",
    tag: "",
    isPublic: true,
    aiPrompt: "",
  });
  let timer: number | null = null;

  const loadVoices = async () => {
    loading.value = true;
    try {
      const response = await fetchMyVoices();
      myVoices.value = response.data;
    } finally {
      loading.value = false;
    }
  };

  const setPrivacy = (value: boolean) => {
    formData.isPublic = value;
  };

  const setCoverFile = (file: File | null) => {
    selectedFiles.cover = file;
  };

  const setSampleFile = (file: File | null) => {
    selectedFiles.sample = file;
  };

  const enterRecordMode = () => {
    uploadMode.value = "record";
    isRecording.value = true;
    let seconds = 0;
    if (timer) window.clearInterval(timer);
    timer = window.setInterval(() => {
      seconds += 1;
      const minute = String(Math.floor(seconds / 60)).padStart(2, "0");
      const second = String(seconds % 60).padStart(2, "0");
      recordTimer.value = `${minute} : ${second}`;
    }, 1000);
  };

  const stopTimer = () => {
    isRecording.value = false;
    if (timer) window.clearInterval(timer);
  };

  const goBack = () => {
    stopTimer();
    recordTimer.value = "00 : 00";
    uploadMode.value = "select";
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      ElMessage.warning("请输入模型名称");
      return;
    }
    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("description", formData.description);
    payload.append("tag", formData.tag || "未分类");
    payload.append("visibility", formData.isPublic ? "public" : "private");
    if (selectedFiles.cover) payload.append("cover", selectedFiles.cover);
    if (selectedFiles.sample) payload.append("sample", selectedFiles.sample);
    const response = await createVoice(payload);
    myVoices.value.unshift(response.data);
    ElMessage.success("声音模型创建成功");
    formData.name = "";
    formData.description = "";
    formData.tag = "";
    formData.aiPrompt = "";
    selectedFiles.cover = null;
    selectedFiles.sample = null;
    goBack();
  };

  const handleDelete = async (id: number) => {
    await deleteVoice(id);
    myVoices.value = myVoices.value.filter((item) => item.id !== id);
    ElMessage.success("声音模型已删除");
  };

  const toggleVisibility = async (voice: VoiceModel) => {
    const nextVisibility = voice.visibility === "public" ? "private" : "public";
    const response = await updateVoiceVisibility(voice.id, nextVisibility);
    myVoices.value = myVoices.value.map((item) => (item.id === voice.id ? response.data : item));
    ElMessage.success("可见性已更新");
  };

  const fillByAi = async () => {
    if (!formData.name || !formData.aiPrompt) {
      ElMessage.warning("请输入模型名称和风格提示");
      return;
    }
    aiLoading.value = true;
    try {
      const response = await generateVoiceDescription({
        name: formData.name,
        prompt: formData.aiPrompt,
      });
      const parsed = JSON.parse(response.data.raw);
      formData.description = parsed.description || formData.description;
      formData.tag = parsed.tag || formData.tag;
      ElMessage.success("AI 描述已生成");
    } catch {
      ElMessage.warning("AI 返回格式异常，请调整提示词重试");
    } finally {
      aiLoading.value = false;
    }
  };

  return {
    loading,
    aiLoading,
    formData,
    uploadMode,
    recordTimer,
    isRecording,
    myVoices,
    setPrivacy,
    setCoverFile,
    setSampleFile,
    enterRecordMode,
    goBack,
    stopTimer,
    handleSubmit,
    handleDelete,
    toggleVisibility,
    fillByAi,
    loadVoices,
  };
}
