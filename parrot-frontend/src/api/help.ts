import { apiRequest } from "../utils/request";
import type { TutorialItem } from "../types";

export const fetchTutorials = (category: string) =>
  apiRequest<TutorialItem[]>({
    url: "/api/help/tutorials",
    method: "GET",
    params: { category },
  });

export const submitFeedback = (data: { usageTime: string; content: string }) =>
  apiRequest<{ id: number; content: string }>({
    url: "/api/help/feedback",
    method: "POST",
    data,
  });
