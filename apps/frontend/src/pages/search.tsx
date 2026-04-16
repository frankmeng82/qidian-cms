import { Card, Col, Empty, Row, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { fetchVideos } from '../services/video';
import type { VideoListItem } from '../types/video';

const { Title } = Typography;

export function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<VideoListItem[]>([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('keyword')?.trim() ?? '';
    setKeyword(q);
    if (!q) {
      setItems([]);
      return;
    }
    let cancelled = false;
    async function load() {
      const data = await fetchVideos({ page: 1, pageSize: 50, keyword: q });
      if (!cancelled) setItems(data.items);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [location.search]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <Title level={3}>搜索：{keyword || '请输入关键词'}</Title>
      {items.length === 0 ? (
        <Empty description="没有找到相关视频" />
      ) : (
        <Row gutter={[16, 16]}>
          {items.map((item) => (
            <Col key={item.id} xs={12} sm={8} md={6}>
              <Card size="small" hoverable onClick={() => navigate(`/video/${item.id}`)}>
                <Card.Meta title={item.title} description={item.year ?? '-'} />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
