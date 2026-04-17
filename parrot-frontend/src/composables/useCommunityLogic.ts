import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  favoriteCommunityVoice,
  fetchCommunityRankings,
  fetchCommunityVoices,
  likeCommunityVoice,
  useCommunityVoice,
} from "../api/community";
import type { VoiceModel } from "../types";

export function useCommunityLogic() {
  const filters = reactive({
    sort: "recommend",
    language: "all",
    search: "",
  });
  const voiceList = ref<Array<VoiceModel & { username: string; userAvatar: string; date: string; desc: string }>>([]);
  const rankList = ref<Array<{ id: number; name: string; username: string; likes: number; userAvatar: string; avatar: string }>>([]);
  const loading = ref(false);

  const load = async () => {
    loading.value = true;
    try {
      const [voicesResponse, rankingsResponse] = await Promise.all([
        fetchCommunityVoices(filters),
        fetchCommunityRankings(),
      ]);
      voiceList.value = voicesResponse.data;
      rankList.value = rankingsResponse.data;
    } finally {
      loading.value = false;
    }
  };

  const updateVoice = (voiceId: number, updater: (voice: typeof voiceList.value[number]) => void) => {
    const target = voiceList.value.find((item) => item.id === voiceId);
    if (target) updater(target);
  };

  const likeVoice = async (voiceId: number) => {
    const response = await likeCommunityVoice(voiceId);
    updateVoice(voiceId, (item) => {
      item.stats = response.data.stats;
    });
    ElMessage.success("点赞成功");
  };

  const favoriteVoice = async (voiceId: number) => {
    const response = await favoriteCommunityVoice(voiceId);
    updateVoice(voiceId, (item) => {
      item.stats = response.data.stats;
    });
    ElMessage.success("收藏成功");
  };

  const useVoice = async (voiceId: number) => {
    await useCommunityVoice(voiceId);
    ElMessage.success("声音已加入创作流程，可前往智能配音页使用");
  };

  return {
    filters,
    voiceList,
    rankList,
    loading,
    load,
    likeVoice,
    favoriteVoice,
    useVoice,
  };
}
