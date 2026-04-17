import { apiRequest } from "../utils/request";
import type { PaginatedResponse, TutorialDetail, TutorialListItem } from "../types";

export const fetchTutorials = (category: string, page = 1, pageSize = 12) =>
  apiRequest<PaginatedResponse<TutorialListItem>>({
    url: "/api/help/tutorials",
    method: "GET",
    params: { category, page, pageSize },
  });

export const fetchTutorialDetail = (id: number) =>
  apiRequest<TutorialDetail>({
    url: `/api/help/tutorials/${id}`,
    method: "GET",
  });

export const submitFeedback = (data: { usageTime: string; content: string }) =>
  apiRequest<{ id: number; content: string }>({
    url: "/api/help/feedback",
    method: "POST",
    data,
  });
