import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { fetchDubbingOptions } from "../api/dubbing";
import { fetchTeachingProjects, generateTeachingScript, generateTeachingVideoTask, saveTeachingProject } from "../api/teaching";
import { waitForTask } from "../api/tasks";
import type { AiModelOption, TeachingProject, TeachingSlide } from "../types";

type ResourceTab = "avatar" | "voice" | "background";

type TeachingResource = {
  id: string;
  type: ResourceTab;
  name: string;
  desc: string;
  cover: string;
  gender?: string;
  pose?: string;
  voiceId?: number | null;
};

const timelinePixelsPerSecond = 18;

const estimateNarrationSeconds = (script: string, fallbackLabel = "") => {
  const normalized = `${script || fallbackLabel}`.replace(/\s+/g, "");
  return Math.max(6, Math.ceil(normalized.length / 4.2));
};

const formatTimelineTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const minute = String(Math.floor(safe / 60)).padStart(2, "0");
  const second = String(safe % 60).padStart(2, "0");
  return `${minute}:${second}`;
};

const createSlide = (index: number, sourceName = ""): TeachingSlide => ({
  id: `slide-${Date.now()}-${index}`,
  title: `第 ${index + 1} 页`,
  script: "",
  sourceName,
});

const avatarResources: TeachingResource[] = [
  { id: "avatar-teacher", type: "avatar", name: "讲师数字人", desc: "适合课堂讲解与知识点拆解", cover: "", gender: "all", pose: "all" },
  { id: "avatar-host", type: "avatar", name: "主持数字人", desc: "适合导学和活动串场", cover: "", gender: "all", pose: "all" },
];

const backgroundResources: TeachingResource[] = [
  { id: "bg-classroom", type: "background", name: "教室背景", desc: "适合课程讲授和板书式内容", cover: "" },
  { id: "bg-lab", type: "background", name: "实验室背景", desc: "适合理工科实验与演示", cover: "" },
  { id: "bg-gradient", type: "background", name: "渐变演示背景", desc: "适合 AI 课件封面和转场", cover: "" },
];

export function useEducationLogic() {
  const settings = reactive({
    ratio: "16:9",
    resolution: "1080P",
    bitrate: "default",
  });
  const slides = ref<TeachingSlide[]>([createSlide(0)]);
  const activeSlideIndex = ref(0);
  const showSubtitle = ref(true);
  const isTrackExpanded = ref(false);
  const textContent = ref("");
  const searchText = ref("");
  const filter = reactive({ gender: "all", pose: "all" });
  const projectTitle = ref("未命名教学项目");
  const projects = ref<TeachingProject[]>([]);
  const aiModels = ref<AiModelOption[]>([]);
  const selectedModel = ref("");
  const aiPrompt = ref("");
  const loading = ref(false);
  const activeResourceTab = ref<ResourceTab>("avatar");
  const teachingMode = ref<"course" | "video">("course");
  const currentProjectId = ref<number | null>(null);
  const selectedAvatarId = ref("avatar-teacher");
  const selectedBackgroundId = ref("bg-gradient");
  const selectedVoiceId = ref<number | null>(null);
  const voiceResources = ref<TeachingResource[]>([]);
  const page = ref(1);
  const pageSize = ref(6);
  const total = ref(0);
  let searchTimer: number | null = null;

  const activeSlide = computed(() => slides.value[activeSlideIndex.value] || slides.value[0]);
  const timelineSlides = computed(() => {
    let cursor = 0;

    return slides.value.map((slide, index) => {
      const durationSeconds = estimateNarrationSeconds(slide.script, slide.title || `第 ${index + 1} 页`);
      const startSeconds = cursor;
      const endSeconds = startSeconds + durationSeconds;
      cursor = endSeconds;

      return {
        id: slide.id,
        index,
        title: slide.title || `第 ${index + 1} 页`,
        script: slide.script || "",
        durationSeconds,
        durationLabel: formatTimelineTime(durationSeconds),
        startSeconds,
        endSeconds,
        left: startSeconds * timelinePixelsPerSecond,
        width: Math.max(140, durationSeconds * timelinePixelsPerSecond),
        isActive: index === activeSlideIndex.value,
      };
    });
  });

  const timelineDurationSeconds = computed(
    () => Math.max(30, timelineSlides.value[timelineSlides.value.length - 1]?.endSeconds || 0),
  );

  const timelineWidth = computed(
    () => Math.max(960, timelineDurationSeconds.value * timelinePixelsPerSecond + 120),
  );

  const timelineMarkers = computed(() => {
    const markers: Array<{ second: number; label: string; left: number }> = [];
    const markerStep = 15;

    for (let second = 0; second <= timelineDurationSeconds.value; second += markerStep) {
      markers.push({
        second,
        label: formatTimelineTime(second),
        left: second * timelinePixelsPerSecond,
      });
    }

    const lastMarker = markers[markers.length - 1];
    if (!lastMarker || lastMarker.second !== timelineDurationSeconds.value) {
      markers.push({
        second: timelineDurationSeconds.value,
        label: formatTimelineTime(timelineDurationSeconds.value),
        left: timelineDurationSeconds.value * timelinePixelsPerSecond,
      });
    }

    return markers;
  });

  const activeTimelineOffset = computed(
    () => timelineSlides.value[activeSlideIndex.value]?.left || 0,
  );

  const timelineDurationLabel = computed(() => formatTimelineTime(timelineDurationSeconds.value));

  const selectedAvatarName = computed(
    () => avatarResources.find((item) => item.id === selectedAvatarId.value)?.name || "未选择数字人",
  );

  const selectedBackgroundName = computed(
    () => backgroundResources.find((item) => item.id === selectedBackgroundId.value)?.name || "未选择背景",
  );

  const selectedVoiceName = computed(
    () => voiceResources.value.find((item) => item.voiceId === selectedVoiceId.value)?.name || "未选择声音",
  );

  watch(
    [projectTitle, textContent],
    () => {
      const slide = activeSlide.value;
      if (!slide) {
        return;
      }
      slide.title = projectTitle.value;
      slide.script = textContent.value;
      slide.backgroundId = selectedBackgroundId.value;
      slide.speakerId = selectedAvatarId.value;
      slide.voiceId = selectedVoiceId.value;
      slide.backgroundName = selectedBackgroundName.value;
      slide.speakerName = selectedAvatarName.value;
      slide.voiceName = selectedVoiceName.value;
    },
    { immediate: true },
  );

  const filteredResources = computed(() => {
    const search = searchText.value.trim().toLowerCase();
    const base =
      activeResourceTab.value === "avatar"
        ? avatarResources
        : activeResourceTab.value === "background"
          ? backgroundResources
          : voiceResources.value;

    return base.filter((item) => {
      const matchesSearch = !search || `${item.name}${item.desc}`.toLowerCase().includes(search);
      const matchesGender = filter.gender === "all" || item.gender === filter.gender;
      const matchesPose = filter.pose === "all" || item.pose === filter.pose;
      return matchesSearch && matchesGender && matchesPose;
    });
  });

  const projectCards = computed(() =>
    projects.value.filter((item) =>
      !searchText.value.trim() || `${item.title}${item.script}`.toLowerCase().includes(searchText.value.toLowerCase()),
    ),
  );

  const syncEditorFromSlide = () => {
    const slide = activeSlide.value;
    if (!slide) {
      return;
    }
    projectTitle.value = slide.title || projectTitle.value;
    textContent.value = slide.script || "";
    if (slide.backgroundId) {
      selectedBackgroundId.value = slide.backgroundId;
    }
    if (slide.speakerId) {
      selectedAvatarId.value = slide.speakerId;
    }
    if (typeof slide.voiceId === "number") {
      selectedVoiceId.value = slide.voiceId;
    }
  };

  const normalizeSlides = (project?: TeachingProject) => {
    if (project?.slides?.length) {
      return project.slides.map((slide, index) => ({
        ...createSlide(index),
        ...slide,
      }));
    }

    return [
      {
        ...createSlide(0),
        title: project?.title || "第 1 页",
        script: project?.script || "",
      },
    ];
  };

  const applyProject = (project: TeachingProject) => {
    currentProjectId.value = project.id;
    teachingMode.value = project.mode || "course";
    settings.ratio = project.ratio;
    settings.resolution = project.resolution;
    settings.bitrate = project.bitrate;
    showSubtitle.value = project.subtitleEnabled;
    selectedVoiceId.value = project.voiceId;
    selectedAvatarId.value = project.speakerId || selectedAvatarId.value;
    selectedBackgroundId.value = project.backgroundId || selectedBackgroundId.value;
    slides.value = normalizeSlides(project);
    activeSlideIndex.value = 0;
    projectTitle.value = project.title;
    textContent.value = project.script;
    ElMessage.success(`已加载项目：${project.title}`);
  };

  const buildProjectPayload = (status = "draft") => ({
    id: currentProjectId.value || undefined,
    title: projectTitle.value.trim() || "未命名教学项目",
    script: textContent.value,
    ratio: settings.ratio,
    resolution: settings.resolution,
    bitrate: settings.bitrate,
    subtitleEnabled: showSubtitle.value,
    voiceId: selectedVoiceId.value,
    status,
    mode: teachingMode.value,
    speakerId: selectedAvatarId.value,
    speakerName: selectedAvatarName.value,
    backgroundId: selectedBackgroundId.value,
    backgroundName: selectedBackgroundName.value,
    voiceName: selectedVoiceName.value,
    slides: slides.value.map((slide) => ({
      ...slide,
      backgroundId: selectedBackgroundId.value,
      backgroundName: selectedBackgroundName.value,
      speakerId: selectedAvatarId.value,
      speakerName: selectedAvatarName.value,
      voiceId: selectedVoiceId.value,
      voiceName: selectedVoiceName.value,
    })),
  });

  const loadProjects = async () => {
    loading.value = true;
    try {
      const [projectsResponse, dubbingResponse] = await Promise.all([
        fetchTeachingProjects(page.value, pageSize.value),
        fetchDubbingOptions(),
      ]);

      projects.value = projectsResponse.data.items.items;
      total.value = projectsResponse.data.items.total;
      aiModels.value = projectsResponse.data.models;
      selectedModel.value =
        projectsResponse.data.models.find((item) => item.isDefault)?.id ||
        projectsResponse.data.models[0]?.id ||
        "";
      voiceResources.value = dubbingResponse.data.voices.map((voice) => ({
        id: `voice-${voice.id}`,
        type: "voice",
        name: voice.name,
        desc: `标签：${voice.tag}`,
        cover: voice.avatar || "",
        voiceId: voice.id,
      }));

      if (!selectedVoiceId.value) {
        selectedVoiceId.value = dubbingResponse.data.voices[0]?.id || null;
      }

      if (projects.value[0] && !currentProjectId.value) {
        applyProject(projects.value[0]);
      } else {
        syncEditorFromSlide();
      }
    } finally {
      loading.value = false;
    }
  };

  const selectSlide = (index: number) => {
    activeSlideIndex.value = index;
    syncEditorFromSlide();
  };

  const selectTimelineClip = (index: number) => {
    selectSlide(index);
  };

  const addSlide = () => {
    slides.value.push(createSlide(slides.value.length));
    selectSlide(slides.value.length - 1);
    ElMessage.success("已新增一页课件");
  };

  const importFiles = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const importedSlides = Array.from(files).map((file, index) => ({
      ...createSlide(index),
      title: file.name.replace(/\.[^.]+$/, ""),
      script: `已导入文件：${file.name}\n请继续补充本页讲解稿。`,
      sourceName: file.name,
    }));
    slides.value = importedSlides;
    activeSlideIndex.value = 0;
    projectTitle.value = importedSlides[0]?.title || "未命名教学项目";
    textContent.value = importedSlides[0]?.script || "";
    ElMessage.success(`已导入 ${files.length} 个文件并生成课件页`);
  };

  const toggleTeachingMode = () => {
    teachingMode.value = teachingMode.value === "course" ? "video" : "course";
    ElMessage.success(teachingMode.value === "course" ? "已切换为 AI 课件模式" : "已切换为讲解视频模式");
  };

  const selectResourceTab = (tab: ResourceTab) => {
    activeResourceTab.value = tab;
  };

  const selectResource = (resource: TeachingResource) => {
    if (resource.type === "avatar") {
      selectedAvatarId.value = resource.id;
      ElMessage.success(`已选择数字人：${resource.name}`);
      return;
    }
    if (resource.type === "background") {
      selectedBackgroundId.value = resource.id;
      ElMessage.success(`已应用背景：${resource.name}`);
      return;
    }
    selectedVoiceId.value = resource.voiceId || null;
    ElMessage.success(`已选择声音：${resource.name}`);
  };

  const handleSaveCurrentSlide = () => {
    const slide = activeSlide.value;
    if (!slide) {
      return;
    }
    slide.title = projectTitle.value;
    slide.script = textContent.value;
    slide.backgroundId = selectedBackgroundId.value;
    slide.backgroundName = selectedBackgroundName.value;
    slide.speakerId = selectedAvatarId.value;
    slide.speakerName = selectedAvatarName.value;
    slide.voiceId = selectedVoiceId.value;
    slide.voiceName = selectedVoiceName.value;
    ElMessage.success(`已保存当前页：${slide.title}`);
  };

  const handleSave = async () => {
    handleSaveCurrentSlide();
    loading.value = true;
    try {
      const response = await saveTeachingProject(buildProjectPayload("draft"));
      currentProjectId.value = response.data.id;
      await loadProjects();
      ElMessage.success("教学项目已保存");
    } finally {
      loading.value = false;
    }
  };

  const handleGenerate = async () => {
    handleSaveCurrentSlide();
    loading.value = true;
    try {
      await saveTeachingProject(buildProjectPayload("completed"));
      const taskResponse = await generateTeachingVideoTask({
        title: projectTitle.value.trim() || "未命名教学项目",
        script: textContent.value,
        voiceId: selectedVoiceId.value,
        ratio: settings.ratio,
        resolution: settings.resolution,
        bitrate: settings.bitrate,
      });
      await waitForTask(taskResponse.data.taskId);
      await loadProjects();
      ElMessage.success("教学视频任务已完成并进入历史记录");
    } finally {
      loading.value = false;
    }
  };

  const generateByAi = async () => {
    if (!aiPrompt.value.trim()) {
      ElMessage.warning("请输入 AI 帮写需求");
      return;
    }

    loading.value = true;
    try {
      const response = await generateTeachingScript({
        prompt: `${aiPrompt.value}\n课件模式：${teachingMode.value === "course" ? "AI 课件" : "讲解视频"}\n当前标题：${projectTitle.value}`,
        model: selectedModel.value,
      });
      const task = await waitForTask<{ content: string }>(response.data.taskId);
      textContent.value = task.result?.content || "";
      handleSaveCurrentSlide();
      ElMessage.success("AI 讲解稿已生成");
    } finally {
      loading.value = false;
    }
  };

  const debouncedSearchProjects = () => {
    if (searchTimer) {
      window.clearTimeout(searchTimer);
    }
    searchTimer = window.setTimeout(() => {
      page.value = 1;
      loadProjects();
    }, 300);
  };

  const handlePageChange = (nextPage: number) => {
    page.value = nextPage;
    loadProjects();
  };

  return {
    settings,
    activeSlideIndex,
    slides,
    timelineSlides,
    timelineMarkers,
    timelineWidth,
    activeTimelineOffset,
    timelineDurationLabel,
    showSubtitle,
    isTrackExpanded,
    textContent,
    searchText,
    filter,
    projectTitle,
    projects,
    projectCards,
    aiModels,
    selectedModel,
    aiPrompt,
    loading,
    activeResourceTab,
    teachingMode,
    filteredResources,
    selectedAvatarId,
    selectedBackgroundId,
    selectedVoiceId,
    selectedAvatarName,
    selectedBackgroundName,
    selectedVoiceName,
    page,
    pageSize,
    total,
    loadProjects,
    handleSave,
    handleGenerate,
    generateByAi,
    importFiles,
    addSlide,
    selectSlide,
    selectTimelineClip,
    handleSaveCurrentSlide,
    toggleTeachingMode,
    selectResourceTab,
    selectResource,
    applyProject,
    debouncedSearchProjects,
    handlePageChange,
  };
}
