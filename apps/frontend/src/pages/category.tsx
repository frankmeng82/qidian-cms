import { Card, Col, Empty, Row, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchCategories } from '../services/category';
import { fetchVideos } from '../services/video';
import type { VideoListItem } from '../types/video';

const { Title } = Typography;

export function CategoryPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [items, setItems] = useState<VideoListItem[]>([]);
  const [categoryName, setCategoryName] = useState('分类');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      const [videos, categories] = await Promise.all([
        fetchVideos({ page: 1, pageSize: 50, categoryId: id }),
        fetchCategories(false),
      ]);
      if (cancelled) return;
      setItems(videos.items);
      const hit = flattenCategory(categories).find((item) => item.id === id);
      setCategoryName(hit?.name ?? '分类');
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <Title level={3}>{categoryName}</Title>
      {items.length === 0 ? (
        <Empty description="该分类暂无内容" />
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

function flattenCategory(
  list: Array<{
    id: string;
    name: string;
    children: unknown[];
  }>,
): Array<{ id: string; name: string }> {
  const result: Array<{ id: string; name: string }> = [];
  const walk = (
    items: Array<{
      id: string;
      name: string;
      children: unknown[];
    }>,
  ) => {
    for (const item of items) {
      result.push({ id: item.id, name: item.name });
      walk(item.children as Array<{ id: string; name: string; children: unknown[] }>);
    }
  };
  walk(list);
  return result;
}
