import { Card, Col, List, Row, Tabs, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchFavorites, fetchHistory, fetchProfile } from '../services/user';

const { Title, Text } = Typography;

export function UserCenterPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username: string; email: string } | null>(null);
  const [favorites, setFavorites] = useState<Array<{ id: string; video: { id: string; title: string } }>>([]);
  const [history, setHistory] = useState<
    Array<{ id: string; progressSecond: number; video: { id: string; title: string } }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [profileData, favoritesData, historyData] = await Promise.all([
        fetchProfile(),
        fetchFavorites(),
        fetchHistory(),
      ]);
      if (cancelled) return;
      setProfile(profileData);
      setFavorites(favoritesData);
      setHistory(historyData);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <Row gutter={16}>
        <Col span={24}>
          <Card style={{ marginBottom: 16 }}>
            <Title level={4} style={{ marginBottom: 0 }}>
              用户中心
            </Title>
            <Text type="secondary">
              {profile?.username ?? '-'} · {profile?.email ?? '-'}
            </Text>
          </Card>
        </Col>
      </Row>
      <Card>
        <Tabs
          items={[
            {
              key: 'favorites',
              label: '我的收藏',
              children: (
                <List
                  dataSource={favorites}
                  renderItem={(item) => (
                    <List.Item onClick={() => navigate(`/video/${item.video.id}`)} style={{ cursor: 'pointer' }}>
                      {item.video.title}
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: 'history',
              label: '播放历史',
              children: (
                <List
                  dataSource={history}
                  renderItem={(item) => (
                    <List.Item onClick={() => navigate(`/play/${item.video.id}`)} style={{ cursor: 'pointer' }}>
                      {item.video.title}（已看 {item.progressSecond}s）
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
