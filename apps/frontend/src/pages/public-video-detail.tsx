import { Button, Card, Descriptions, Space, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { addFavorite } from '../services/user';
import { fetchVideoDetail } from '../services/video';
import type { VideoDetail } from '../types/video';

const { Title, Paragraph } = Typography;

export function PublicVideoDetailPage() {
  const { id } = useParams();
  const videoId = id ?? '';
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoDetail | null>(null);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchVideoDetail(videoId);
        if (!cancelled) setVideo(data);
      } catch {
        message.error('视频不存在或已下线');
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  if (!video) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
      <Card>
        <Title level={3}>{video.title}</Title>
        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" onClick={() => navigate(`/play/${video.id}`)}>
            立即播放
          </Button>
          <Button
            onClick={async () => {
              try {
                await addFavorite(video.id);
                message.success('已加入收藏');
              } catch {
                message.error('收藏失败，请先登录');
              }
            }}
          >
            收藏
          </Button>
        </Space>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="分类">{video.category?.name ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="年份">{video.year ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="简介">
            <Paragraph style={{ marginBottom: 0 }}>{video.description ?? '-'}</Paragraph>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
