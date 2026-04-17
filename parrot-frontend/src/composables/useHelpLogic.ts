import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { fetchTutorials, submitFeedback as submitFeedbackApi } from "../api/help";
import type { TutorialItem } from "../types";

export function useHelpLogic() {
  const router = useRouter();
  const activeTab = ref("guide");
  const videoList = ref<TutorialItem[]>([]);
  const tutorialVisible = ref(false);
  const currentTutorial = ref<TutorialItem | null>(null);
  const feedbackForm = reactive({
    usageTime: "不到 1 个月",
    content: "",
  });

  const defaultTargetMap: Record<string, string> = {
    guide: "/home",
    dubbing: "/dubbing",
    clone: "/clone",
    education: "/teching",
  };

  const buildSteps = (tutorial: TutorialItem) =>
    tutorial.steps?.length
      ? tutorial.steps
      : [
          `了解「${tutorial.title}」的核心目标和适用场景。`,
          tutorial.summary || "按页面提示完成配置并生成内容。",
          "保存结果后到历史记录或用户中心继续查看。",
        ];

  const switchTab = async (tab: string) => {
    activeTab.value = tab;
    if (tab !== "feedback") {
      const response = await fetchTutorials(tab);
      videoList.value = response.data.map((item) => ({
        ...item,
        steps: buildSteps(item),
        targetRoute: item.targetRoute || defaultTargetMap[item.category] || "/help",
      }));
    }
  };

  const openTutorial = (tutorial: TutorialItem) => {
    currentTutorial.value = {
      ...tutorial,
      steps: buildSteps(tutorial),
      targetRoute: tutorial.targetRoute || defaultTargetMap[tutorial.category] || "/help",
    };
    tutorialVisible.value = true;
  };

  const goToTutorialTarget = () => {
    if (!currentTutorial.value?.targetRoute) {
      tutorialVisible.value = false;
      return;
    }
    tutorialVisible.value = false;
    router.push(currentTutorial.value.targetRoute);
  };

  const submitFeedback = async () => {
    if (!feedbackForm.content) {
      ElMessage.warning("请填写反馈内容");
      return;
    }
    await submitFeedbackApi(feedbackForm);
    feedbackForm.usageTime = "不到 1 个月";
    feedbackForm.content = "";
    ElMessage.success("反馈提交成功");
  };

  return {
    activeTab,
    feedbackForm,
    videoList,
    tutorialVisible,
    currentTutorial,
    switchTab,
    openTutorial,
    goToTutorialTarget,
    submitFeedback,
  };
}
