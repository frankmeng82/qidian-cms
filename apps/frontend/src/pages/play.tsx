import { Alert, Card, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { VideoPlayer } from '../components/video-player';
import { reportPlayProgress } from '../services/video';
import { fetchVideoPlay } from '../services/video';
import type { VideoPlayResponse } from '../types/play';

const { Title } = Typography;

export function PlayPage() {
  const { id } = useParams();
  const videoId = id ?? '';
  const [playData, setPlayData] = useState<VideoPlayResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchVideoPlay(videoId);
        if (!cancelled) setPlayData(data);
      } catch {
        if (!cancelled) setError('播放源暂不可用，请稍后重试');
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  if (error) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
        <Alert type="error" message={error} />
      </div>
    );
  }

  if (!playData) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
      <Card>
        <Title level={4}>{playData.title}</Title>
        <VideoPlayer
          videoId={playData.id}
          lines={playData.lines}
          onProgress={({ episodeId, progressSecond }) => {
            if (!videoId) return;
            void reportPlayProgress(videoId, { episodeId, progressSecond });
          }}
        />
      </Card>
    </div>
  );
}
