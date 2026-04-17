import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import {
  favoriteCommunityVoice,
  fetchCommunityRankings,
  fetchCommunityVoices,
  likeCommunityVoice,
  playCommunityVoice,
  useCommunityVoice,
} from "../api/community";
import type { VoiceModel } from "../types";

export function useCommunityLogic() {
  const router = useRouter();
  const filters = reactive({
    sort: "recommend",
    language: "all",
    search: "",
  });
  const voiceList = ref<Array<VoiceModel & { username: string; userAvatar: string; date: string; desc: string }>>([]);
  const rankList = ref<Array<{ id: number; name: string; username: string; likes: number; userAvatar: string; avatar: string }>>([]);
  const loading = ref(false);
  const playingId = ref<number | null>(null);
  let currentAudio: HTMLAudioElement | null = null;

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

  const updateRank = (voiceId: number, likes: number) => {
    const rankItem = rankList.value.find((item) => item.id === voiceId);
    if (rankItem) {
      rankItem.likes = likes;
    }
  };

  const rememberVoice = (voiceId: number) => {
    localStorage.setItem("preferredCommunityVoiceId", String(voiceId));
  };

  const previewVoice = async (voiceId: number, audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    const response = await playCommunityVoice(voiceId);
    updateVoice(voiceId, (item) => {
      item.stats = response.data.stats;
    });

    const audio = new Audio(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}${audioUrl}`);
    currentAudio = audio;
    playingId.value = voiceId;
    audio.onended = () => {
      playingId.value = null;
      currentAudio = null;
    };
    audio.play().catch(() => {
      playingId.value = null;
      currentAudio = null;
      ElMessage.warning("音频暂时无法播放");
    });
  };

  const likeVoice = async (voiceId: number) => {
    const response = await likeCommunityVoice(voiceId);
    updateVoice(voiceId, (item) => {
      item.stats = response.data.stats;
    });
    updateRank(voiceId, response.data.stats.like);
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
    rememberVoice(voiceId);
    ElMessage.success("声音已加入创作流程，正在跳转到智能配音");
    router.push("/dubbing");
  };

  const useRankVoice = (voiceId: number) => {
    useVoice(voiceId);
  };

  return {
    filters,
    voiceList,
    rankList,
    loading,
    playingId,
    load,
    previewVoice,
    likeVoice,
    favoriteVoice,
    useVoice,
    useRankVoice,
  };
}
