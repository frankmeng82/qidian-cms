import { Card, Descriptions, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { fetchVideoDetail } from '../services/video';
import type { VideoDetail } from '../types/video';

const { Title } = Typography;

export function VideoDetailPage() {
  const { id } = useParams();
  const videoId = id ?? '';
  const [video, setVideo] = useState<VideoDetail | null>(null);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    async function load() {
      const data = await fetchVideoDetail(videoId);
      if (!cancelled) setVideo(data);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  return (
    <Card>
      <Title level={4}>视频详情</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="标题">{video?.title ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="年份">{video?.year ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color="green">正常</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="简介">{video?.description ?? '-'}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
