import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { fetchTeachingProjects, generateTeachingScript, saveTeachingProject } from "../api/teaching";
import type { AiModelOption, TeachingProject } from "../types";

export function useEducationLogic() {
  const settings = reactive({
    ratio: "16:9",
    resolution: "1080P",
    bitrate: "default",
  });
  const slides = ref([1, 2, 3]);
  const activeSlideIndex = ref(0);
  const showSubtitle = ref(true);
  const isTrackExpanded = ref(false);
  const textContent = ref("");
  const searchText = ref("");
  const filter = reactive({ gender: "all", pose: "all" });
  const zoomLevel = ref(50);
  const projectTitle = ref("未命名教学项目");
  const projects = ref<TeachingProject[]>([]);
  const aiModels = ref<AiModelOption[]>([]);
  const selectedModel = ref("");
  const aiPrompt = ref("");
  const loading = ref(false);

  const loadProjects = async () => {
    const response = await fetchTeachingProjects();
    projects.value = response.data.projects;
    aiModels.value = response.data.models;
    selectedModel.value = response.data.models[0]?.id || "";
    if (response.data.projects[0]) {
      const project = response.data.projects[0];
      projectTitle.value = project.title;
      textContent.value = project.script;
      settings.ratio = project.ratio;
      settings.resolution = project.resolution;
      settings.bitrate = project.bitrate;
      showSubtitle.value = project.subtitleEnabled;
    }
  };

  const handleSave = async (status = "draft") => {
    loading.value = true;
    try {
      await saveTeachingProject({
        title: projectTitle.value,
        script: textContent.value,
        ratio: settings.ratio,
        resolution: settings.resolution,
        bitrate: settings.bitrate,
        subtitleEnabled: showSubtitle.value,
        status,
      });
      await loadProjects();
      ElMessage.success(status === "completed" ? "教学任务已生成" : "教学项目已保存");
    } finally {
      loading.value = false;
    }
  };

  const handleGenerate = async () => handleSave("completed");

  const generateByAi = async () => {
    if (!aiPrompt.value) {
      ElMessage.warning("请输入 AI 帮写需求");
      return;
    }
    const response = await generateTeachingScript({
      prompt: aiPrompt.value,
      model: selectedModel.value,
    });
    textContent.value = response.data.content;
    ElMessage.success("AI 讲解稿已生成");
  };

  return {
    settings,
    activeSlideIndex,
    slides,
    showSubtitle,
    isTrackExpanded,
    textContent,
    searchText,
    filter,
    zoomLevel,
    projectTitle,
    projects,
    aiModels,
    selectedModel,
    aiPrompt,
    loading,
    loadProjects,
    handleSave,
    handleGenerate,
    generateByAi,
  };
}
