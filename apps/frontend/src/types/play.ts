export type PlayEpisode = {
  id: string;
  title: string;
  episodeNo: number;
  url: string;
  quality: '480P' | '720P' | '1080P' | '4K' | 'AUTO';
  sourceType: 'mp4' | 'm3u8' | 'flv' | string;
};

export type PlayLine = {
  id: string;
  name: string;
  type: string;
  episodes: PlayEpisode[];
};

export type VideoPlayResponse = {
  id: string;
  title: string;
  coverImage?: string | null;
  lines: PlayLine[];
};
