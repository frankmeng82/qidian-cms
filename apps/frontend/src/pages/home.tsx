import { Card, Col, Empty, Input, Row, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchVideos } from '../services/video';
import type { VideoListItem } from '../types/video';

const { Title } = Typography;

export function HomePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<VideoListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchVideos({ page: 1, pageSize: 24 });
        if (!cancelled) setItems(data.items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <Title level={3}>奇点影视</Title>
      <Input.Search
        placeholder="搜索视频"
        enterButton
        style={{ marginBottom: 16 }}
        onSearch={(keyword) => {
          if (keyword.trim()) navigate(`/search?keyword=${encodeURIComponent(keyword.trim())}`);
        }}
      />
      {items.length === 0 && !loading ? (
        <Empty description="暂无内容" />
      ) : (
        <Row gutter={[16, 16]}>
          {items.map((item) => (
            <Col key={item.id} xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                size="small"
                onClick={() => navigate(`/video/${item.id}`)}
                cover={
                  <div
                    style={{
                      height: 220,
                      backgroundImage: item.category
                        ? undefined
                        : 'linear-gradient(120deg,#e5e7eb,#f3f4f6)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                }
              >
                <Card.Meta title={item.title} description={item.year ?? '-'} />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
