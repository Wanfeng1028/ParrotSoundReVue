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
import { resolveMediaUrl } from "../utils/media";

type CommunityVoice = VoiceModel & {
  username: string;
  userAvatar: string;
  date: string;
  desc: string;
  avatar: string;
};

export function useCommunityLogic() {
  const router = useRouter();
  const filters = reactive({
    sort: "recommend",
    language: "all",
    search: "",
  });
  const voiceList = ref<CommunityVoice[]>([]);
  const rankList = ref<Array<{ id: number; name: string; username: string; likes: number; userAvatar: string; avatar: string }>>([]);
  const loading = ref(false);
  const playingId = ref<number | null>(null);
  const page = ref(1);
  const pageSize = ref(6);
  const total = ref(0);
  let currentAudio: HTMLAudioElement | null = null;
  let searchTimer: number | null = null;

  const syncVoiceStats = (voiceId: number, nextStats: VoiceModel["stats"]) => {
    voiceList.value = voiceList.value.map((item) =>
      item.id === voiceId
        ? {
            ...item,
            stats: { ...nextStats },
          }
        : item,
    );

    rankList.value = [...rankList.value]
      .map((item) =>
        item.id === voiceId
          ? {
              ...item,
              likes: nextStats.like,
            }
          : item,
      )
      .sort((a, b) => b.likes - a.likes);
  };

  const load = async () => {
    loading.value = true;
    try {
      const [voicesResponse, rankingsResponse] = await Promise.all([
        fetchCommunityVoices({ ...filters, page: page.value, pageSize: pageSize.value }),
        fetchCommunityRankings({ page: 1, pageSize: 5 }),
      ]);
      voiceList.value = voicesResponse.data.items;
      total.value = voicesResponse.data.total;
      rankList.value = rankingsResponse.data.items;
    } finally {
      loading.value = false;
    }
  };

  const debouncedLoad = () => {
    if (searchTimer) {
      window.clearTimeout(searchTimer);
    }
    searchTimer = window.setTimeout(() => {
      page.value = 1;
      load();
    }, 300);
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
    syncVoiceStats(voiceId, response.data.stats);

    const audio = new Audio(resolveMediaUrl(audioUrl));
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
    syncVoiceStats(voiceId, response.data.stats);
    ElMessage.success("点赞成功");
  };

  const favoriteVoice = async (voiceId: number) => {
    const response = await favoriteCommunityVoice(voiceId);
    syncVoiceStats(voiceId, response.data.stats);
    ElMessage.success("收藏成功");
  };

  const useVoice = async (voiceId: number) => {
    const target = voiceList.value.find((item) => item.id === voiceId);
    await useCommunityVoice(voiceId);
    if (target) {
      syncVoiceStats(voiceId, {
        ...target.stats,
        use: target.stats.use + 1,
      });
    }
    rememberVoice(voiceId);
    ElMessage.success("声音已加入创作流程，正在跳转到智能配音");
    router.push("/dubbing");
  };

  const useRankVoice = (voiceId: number) => {
    useVoice(voiceId);
  };

  const handlePageChange = (nextPage: number) => {
    page.value = nextPage;
    load();
  };

  return {
    filters,
    voiceList,
    rankList,
    loading,
    playingId,
    page,
    pageSize,
    total,
    load,
    debouncedLoad,
    previewVoice,
    likeVoice,
    favoriteVoice,
    useVoice,
    useRankVoice,
    handlePageChange,
  };
}
