type VideoFactoryInput = {
  id?: string;
  title?: string;
  year?: number | null;
  status?: number;
  category?: { id: string; name: string } | null;
};

type UserFactoryInput = {
  id?: string;
  email?: string;
  username?: string;
  role?: 'USER' | 'ADMIN';
  password?: string;
  status?: number;
};

let seed = 1;

export function resetFactorySeed() {
  seed = 1;
}

export function makeVideo(input: VideoFactoryInput = {}) {
  const current = seed++;
  return {
    id: input.id ?? `video-${current}`,
    title: input.title ?? `视频-${current}`,
    subtitle: null,
    description: null,
    year: input.year ?? 2026,
    coverImage: null,
    status: input.status ?? 1,
    category: input.category ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function makeUser(input: UserFactoryInput = {}) {
  const current = seed++;
  return {
    id: input.id ?? `user-${current}`,
    email: input.email ?? `user-${current}@example.com`,
    username: input.username ?? `user${current}`,
    role: input.role ?? 'USER',
    password: input.password ?? 'hashed',
    status: input.status ?? 1,
  };
}
