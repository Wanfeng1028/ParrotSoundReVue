import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { fetchTutorials, submitFeedback as submitFeedbackApi } from "../api/help";
import type { TutorialItem } from "../types";

export function useHelpLogic() {
  const activeTab = ref("guide");
  const videoList = ref<TutorialItem[]>([]);
  const feedbackForm = reactive({
    usageTime: "不到 1 个月",
    content: "",
  });

  const switchTab = async (tab: string) => {
    activeTab.value = tab;
    if (tab !== "feedback") {
      const response = await fetchTutorials(tab);
      videoList.value = response.data;
    }
  };

  const submitFeedback = async () => {
    if (!feedbackForm.content) {
      ElMessage.warning("请填写反馈内容");
      return;
    }
    await submitFeedbackApi(feedbackForm);
    feedbackForm.content = "";
    ElMessage.success("反馈提交成功");
  };

  return {
    activeTab,
    feedbackForm,
    videoList,
    switchTab,
    submitFeedback,
  };
}
