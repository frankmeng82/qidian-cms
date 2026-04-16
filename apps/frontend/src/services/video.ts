import type { VideoPlayResponse } from '../types/play';
import type { VideoDetail, VideoListResponse } from '../types/video';

import { http } from './http';

type ListVideoParams = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: string;
  year?: number;
  status?: number;
};

export async function fetchVideos(params: ListVideoParams): Promise<VideoListResponse> {
  const { data } = await http.get<VideoListResponse>('/videos', { params });
  return data;
}

export async function fetchVideoDetail(id: string): Promise<VideoDetail> {
  const { data } = await http.get<VideoDetail>(`/videos/${id}`);
  return data;
}

export async function fetchVideoPlay(id: string): Promise<VideoPlayResponse> {
  const { data } = await http.get<VideoPlayResponse>(`/videos/${id}/play`);
  return data;
}

export async function reportPlayProgress(
  id: string,
  payload: { episodeId?: string; progressSecond: number },
) {
  await http.post(`/videos/${id}/progress`, payload);
}

export async function createVideo(payload: {
  title: string;
  subtitle?: string;
  description?: string;
  year?: number;
  categoryId?: string;
}) {
  const { data } = await http.post('/videos', payload);
  return data;
}

export async function updateVideo(
  id: string,
  payload: {
    title?: string;
    subtitle?: string;
    description?: string;
    year?: number;
    categoryId?: string;
  },
) {
  const { data } = await http.put(`/videos/${id}`, payload);
  return data;
}
