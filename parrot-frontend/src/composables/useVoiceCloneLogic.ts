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
  const recordedAudioUrl = ref("");
  const sampleName = ref("");
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
  let mediaRecorder: MediaRecorder | null = null;
  let mediaStream: MediaStream | null = null;
  let recordedChunks: Blob[] = [];

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
    sampleName.value = file?.name || "";
    if (recordedAudioUrl.value && !file) {
      URL.revokeObjectURL(recordedAudioUrl.value);
      recordedAudioUrl.value = "";
    }
  };

  const syncTimer = () => {
    let seconds = 0;
    if (timer) window.clearInterval(timer);
    timer = window.setInterval(() => {
      seconds += 1;
      const minute = String(Math.floor(seconds / 60)).padStart(2, "0");
      const second = String(seconds % 60).padStart(2, "0");
      recordTimer.value = `${minute} : ${second}`;
    }, 1000);
  };

  const enterRecordMode = async () => {
    uploadMode.value = "record";
    if (!navigator.mediaDevices?.getUserMedia) {
      ElMessage.warning("当前浏览器不支持录音，请上传音频文件");
      return;
    }

    try {
      recordedChunks = [];
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const file = new File([blob], `record-${Date.now()}.webm`, { type: blob.type });
        setSampleFile(file);
        if (recordedAudioUrl.value) {
          URL.revokeObjectURL(recordedAudioUrl.value);
        }
        recordedAudioUrl.value = URL.createObjectURL(blob);
        mediaStream?.getTracks().forEach((track) => track.stop());
        mediaStream = null;
        mediaRecorder = null;
        ElMessage.success("录音样本已生成，可直接提交");
      };
      mediaRecorder.start();
      isRecording.value = true;
      syncTimer();
    } catch {
      ElMessage.warning("麦克风权限获取失败，请改为上传音频文件");
      uploadMode.value = "select";
    }
  };

  const stopTimer = () => {
    isRecording.value = false;
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  const goBack = () => {
    if (isRecording.value) {
      stopTimer();
    }
    recordTimer.value = "00 : 00";
    uploadMode.value = "select";
  };

  const previewSample = () => {
    if (!recordedAudioUrl.value && !selectedFiles.sample) {
      ElMessage.warning("请先上传或录制音频样本");
      return;
    }
    const needsCleanup = !recordedAudioUrl.value && !!selectedFiles.sample;
    const targetUrl = recordedAudioUrl.value || URL.createObjectURL(selectedFiles.sample as File);
    const audio = new Audio(targetUrl);
    audio.onended = () => {
      if (needsCleanup) {
        URL.revokeObjectURL(targetUrl);
      }
    };
    audio.play().catch(() => {
      if (needsCleanup) {
        URL.revokeObjectURL(targetUrl);
      }
      ElMessage.warning("样本暂时无法播放");
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      ElMessage.warning("请输入模型名称");
      return;
    }
    if (!selectedFiles.sample) {
      ElMessage.warning("请先上传或录制音频样本");
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
    sampleName.value = "";
    if (recordedAudioUrl.value) {
      URL.revokeObjectURL(recordedAudioUrl.value);
      recordedAudioUrl.value = "";
    }
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
    recordedAudioUrl,
    sampleName,
    myVoices,
    setPrivacy,
    setCoverFile,
    setSampleFile,
    enterRecordMode,
    goBack,
    stopTimer,
    previewSample,
    handleSubmit,
    handleDelete,
    toggleVisibility,
    fillByAi,
    loadVoices,
  };
}
