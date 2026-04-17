export interface AuthUser {
  id: number;
  email: string;
  username: string;
  phone?: string;
  age?: string;
  gender?: string;
  avatarUrl?: string;
  securityAnswers?: {
    q1: string;
    q2: string;
    q3: string;
  };
}

export interface AiModelOption {
  id: string;
  label: string;
  provider?: string;
  isDefault?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TaskStatusResponse<T = unknown> {
  taskId: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  result: T | null;
  error?: string | null;
  type?: string;
  updatedAt?: string;
}

export interface VoiceModel {
  id: number;
  userId: number;
  name: string;
  description: string;
  tag: string;
  language: string;
  visibility: "public" | "private";
  coverUrl: string;
  sampleAudioUrl: string;
  createdAt: string;
  authorName?: string;
  authorAvatar?: string;
  stats: {
    play: number;
    like: number;
    favorite: number;
    use: number;
  };
}

export interface DubbingJob {
  id: number;
  userId: number;
  type: "audio" | "teaching";
  title: string;
  text: string;
  voiceId: number | null;
  status: "processing" | "completed";
  audioUrl: string;
  createdAt: string;
  updatedAt: string;
  settings: Record<string, unknown>;
}

export interface InteractionItem {
  id: number;
  type: "favorite" | "like" | "use";
  actorName: string;
  actorAvatar: string;
  voiceName: string;
  voiceCover: string;
  createdAt: string;
}

export interface NotificationItem {
  id: number;
  type: "system" | "info";
  title: string;
  desc: string;
  createdAt: string;
}

export interface TutorialListItem {
  id: number;
  category: string;
  title: string;
  duration: string;
  cover: string;
  summary: string;
}

export interface TutorialDetail extends TutorialListItem {
  content?: string;
  steps?: string[];
  targetRoute?: string;
}

export interface TeachingSlide {
  id: string;
  title: string;
  script: string;
  sourceName?: string;
  backgroundId?: string;
  backgroundName?: string;
  speakerId?: string;
  speakerName?: string;
  voiceId?: number | null;
  voiceName?: string;
}

export interface TeachingProject {
  id: number;
  title: string;
  script: string;
  ratio: string;
  resolution: string;
  bitrate: string;
  subtitleEnabled: boolean;
  voiceId: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  slides?: TeachingSlide[];
  mode?: "course" | "video";
  speakerId?: string;
  speakerName?: string;
  backgroundId?: string;
  backgroundName?: string;
  voiceName?: string;
}
