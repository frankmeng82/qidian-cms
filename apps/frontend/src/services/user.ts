import { http } from './http';

export async function fetchProfile() {
  const { data } = await http.get('/user/profile');
  return data;
}

export async function fetchFavorites() {
  const { data } = await http.get('/user/favorites');
  return data as Array<{
    id: string;
    video: {
      id: string;
      title: string;
      coverImage: string | null;
      year: number | null;
    };
  }>;
}

export async function addFavorite(videoId: string) {
  await http.post('/user/favorites', { videoId });
}

export async function removeFavorite(videoId: string) {
  await http.delete(`/user/favorites/${videoId}`);
}

export async function fetchHistory() {
  const { data } = await http.get('/user/history');
  return data as Array<{
    id: string;
    progressSecond: number;
    watchedAt: string;
    video: {
      id: string;
      title: string;
      coverImage: string | null;
      year: number | null;
    };
  }>;
}
