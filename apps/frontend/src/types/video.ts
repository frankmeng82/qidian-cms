export type VideoListItem = {
  id: string;
  title: string;
  year: number | null;
  status: number;
  createdAt: string;
  category: {
    id: string;
    name: string;
  } | null;
};

export type VideoListResponse = {
  items: VideoListItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type VideoDetail = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  year: number | null;
  coverImage: string | null;
  category: {
    id: string;
    name: string;
  } | null;
};
