import { onUnmounted, reactive, ref } from "vue";
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

const likedStorageKey = "parrot:community:liked";
const favoritedStorageKey = "parrot:community:favorited";
const femaleVoiceMatcher = /女|female|xiao|ya|girl|community/i;

const readStoredIds = (storageKey: string) => {
  if (typeof window === "undefined") {
    return new Set<number>();
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return new Set<number>();
    }
    const parsed = JSON.parse(raw) as number[];
    return new Set(parsed.filter((value) => Number.isFinite(value)));
  } catch {
    return new Set<number>();
  }
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
  const likedIds = ref<Set<number>>(readStoredIds(likedStorageKey));
  const favoritedIds = ref<Set<number>>(readStoredIds(favoritedStorageKey));
  let currentAudio: HTMLAudioElement | null = null;
  let speechVoiceId: number | null = null;
  let searchTimer: number | null = null;

  const persistIds = (storageKey: string, ids: Set<number>) => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify([...ids]));
  };

  const updateStoredIds = (storageKey: string, source: typeof likedIds, voiceId: number, nextActive: boolean) => {
    const nextIds = new Set(source.value);
    if (nextActive) {
      nextIds.add(voiceId);
    } else {
      nextIds.delete(voiceId);
    }
    source.value = nextIds;
    persistIds(storageKey, nextIds);
  };

  const stopPreview = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    speechVoiceId = null;
    playingId.value = null;
  };

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

  const updateVoiceStats = (voiceId: number, transform: (stats: VoiceModel["stats"]) => VoiceModel["stats"]) => {
    const currentVoice = voiceList.value.find((item) => item.id === voiceId);
    if (!currentVoice) {
      return;
    }
    syncVoiceStats(voiceId, transform(currentVoice.stats));
  };

  const isPlaceholderAudio = (audioUrl: string) =>
    audioUrl.includes("/api/media/demo-audio") ||
    audioUrl.includes("/api/media/voice-chaowen") ||
    audioUrl.includes("/api/media/voice-xiaoya");

  const pickSpeechVoice = (voice: CommunityVoice) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return null;
    }

    const availableVoices = window.speechSynthesis.getVoices();
    if (!availableVoices.length) {
      return null;
    }

    const wantsFemale = femaleVoiceMatcher.test(`${voice.name} ${voice.tag} ${voice.desc}`);
    const zhVoices = availableVoices.filter((item) => /^zh/i.test(item.lang) || /Chinese|中文/i.test(item.name));
    const prioritizedVoices = zhVoices.length ? zhVoices : availableVoices;

    return (
      prioritizedVoices.find((item) => {
        const label = `${item.name} ${item.lang}`;
        return wantsFemale ? /female|woman|xiao|hui|mei|ya|nan|ting/i.test(label) : /male|man|yun|gang|liang|bo/i.test(label);
      }) ?? prioritizedVoices[0]
    );
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
      if (filters.search.trim() && !voicesResponse.data.items.length) {
        ElMessage.warning("没有找到匹配的社区声音，试试别的关键词");
      }
    } finally {
      loading.value = false;
    }
  };

  const reloadFromFirstPage = () => {
    page.value = 1;
    load();
  };

  const debouncedLoad = () => {
    if (searchTimer) {
      window.clearTimeout(searchTimer);
    }
    searchTimer = window.setTimeout(() => {
      reloadFromFirstPage();
    }, 300);
  };

  const submitSearch = () => {
    filters.search = filters.search.trim();
    reloadFromFirstPage();
  };

  const rememberVoice = (voiceId: number) => {
    localStorage.setItem("preferredCommunityVoiceId", String(voiceId));
  };

  const previewVoice = async (voice: CommunityVoice) => {
    const sameVoiceActive = playingId.value === voice.id;

    if (sameVoiceActive && currentAudio) {
      if (currentAudio.paused) {
        await currentAudio.play().catch(() => {
          ElMessage.warning("音频暂时无法播放");
        });
        return;
      }
      currentAudio.pause();
      return;
    }

    if (sameVoiceActive && speechVoiceId === voice.id && typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
      }
      return;
    }

    stopPreview();

    const response = await playCommunityVoice(voice.id);
    syncVoiceStats(voice.id, response.data.stats);

    const spokenText = voice.desc || voice.description;
    if (spokenText && typeof window !== "undefined" && "speechSynthesis" in window && isPlaceholderAudio(voice.sampleAudioUrl)) {
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = "zh-CN";
      utterance.rate = 1;
      utterance.pitch = 1;
      const browserVoice = pickSpeechVoice(voice);
      if (browserVoice) {
        utterance.voice = browserVoice;
      }
      speechVoiceId = voice.id;
      playingId.value = voice.id;
      utterance.onend = () => {
        if (speechVoiceId === voice.id) {
          stopPreview();
        }
      };
      utterance.onerror = () => {
        stopPreview();
        ElMessage.warning("当前浏览器语音朗读不可用");
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      return;
    }

    const audio = new Audio(resolveMediaUrl(voice.sampleAudioUrl));
    currentAudio = audio;
    playingId.value = voice.id;
    audio.onended = () => {
      stopPreview();
    };
    audio.play().catch(() => {
      stopPreview();
      ElMessage.warning("音频暂时无法播放");
    });
  };

  const likeVoice = async (voiceId: number) => {
    const isActive = likedIds.value.has(voiceId);

    if (isActive) {
      updateStoredIds(likedStorageKey, likedIds, voiceId, false);
      updateVoiceStats(voiceId, (stats) => ({
        ...stats,
        like: Math.max(0, stats.like - 1),
      }));
      ElMessage.success("已取消点赞");
      return;
    }

    const response = await likeCommunityVoice(voiceId);
    syncVoiceStats(voiceId, response.data.stats);
    updateStoredIds(likedStorageKey, likedIds, voiceId, true);
    ElMessage.success("点赞成功");
  };

  const favoriteVoice = async (voiceId: number) => {
    const isActive = favoritedIds.value.has(voiceId);

    if (isActive) {
      updateStoredIds(favoritedStorageKey, favoritedIds, voiceId, false);
      updateVoiceStats(voiceId, (stats) => ({
        ...stats,
        favorite: Math.max(0, stats.favorite - 1),
      }));
      ElMessage.success("已取消收藏");
      return;
    }

    const response = await favoriteCommunityVoice(voiceId);
    syncVoiceStats(voiceId, response.data.stats);
    updateStoredIds(favoritedStorageKey, favoritedIds, voiceId, true);
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

  const isLiked = (voiceId: number) => likedIds.value.has(voiceId);
  const isFavorited = (voiceId: number) => favoritedIds.value.has(voiceId);

  onUnmounted(() => {
    stopPreview();
  });

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
    reloadFromFirstPage,
    debouncedLoad,
    submitSearch,
    isLiked,
    isFavorited,
    previewVoice,
    likeVoice,
    favoriteVoice,
    useVoice,
    useRankVoice,
    handlePageChange,
  };
}
