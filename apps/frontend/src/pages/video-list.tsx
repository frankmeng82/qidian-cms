import { Button, Card, Input, Space, Table, Tag, Typography, message } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchVideos } from '../services/video';
import type { VideoListItem } from '../types/video';

const { Title } = Typography;

export function VideoListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<VideoListItem[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [query, setQuery] = useState({ page: 1, pageSize: 10, keyword: '' });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadVideos() {
      setLoading(true);
      try {
        const data = await fetchVideos(query);
        if (!cancelled) {
          setDataSource(data.items);
          setTotal(data.pagination.total);
        }
      } catch {
        message.error('获取视频列表失败，请稍后重试');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadVideos();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const columns = useMemo(
    () => [
      { title: '标题', dataIndex: 'title' as const },
      {
        title: '分类',
        render: (_: unknown, record: VideoListItem) => record.category?.name ?? '-',
      },
      {
        title: '年份',
        dataIndex: 'year' as const,
        render: (value: number | null) => value ?? '-',
      },
      {
        title: '状态',
        dataIndex: 'status' as const,
        render: (value: number) =>
          value === 1 ? <Tag color="green">正常</Tag> : <Tag color="default">已删除</Tag>,
      },
      {
        title: '操作',
        render: (_: unknown, record: VideoListItem) => (
          <Space>
            <Button size="small" onClick={() => navigate(`/admin/videos/${record.id}`)}>
              详情
            </Button>
            <Button size="small" onClick={() => navigate(`/admin/videos/${record.id}/edit`)}>
              编辑
            </Button>
          </Space>
        ),
      },
    ],
    [navigate],
  );

  function onTableChange(pagination: TablePaginationConfig) {
    setQuery((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? prev.pageSize,
    }));
  }

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>
            视频管理
          </Title>
          <Button type="primary" onClick={() => navigate('/admin/videos/new')}>
            添加视频
          </Button>
        </Space>
        <Input.Search
          placeholder="按标题搜索"
          enterButton
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          onSearch={() =>
            setQuery((prev) => ({
              ...prev,
              keyword: keywordInput.trim(),
              page: 1,
            }))
          }
          style={{ maxWidth: 320 }}
        />
        <Table
          rowKey="id"
          loading={loading}
          dataSource={dataSource}
          onChange={onTableChange}
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
          }}
          columns={columns}
        />
      </Space>
    </Card>
  );
}
