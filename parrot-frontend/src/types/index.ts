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

export interface TutorialItem {
  id: number;
  category: string;
  title: string;
  duration: string;
  cover: string;
  summary: string;
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
}
