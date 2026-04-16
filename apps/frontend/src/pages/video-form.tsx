import { Button, Card, Form, Input, InputNumber, Select, Space, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchCategories } from '../services/category';
import { createVideo, fetchVideoDetail, updateVideo } from '../services/video';

const { Title } = Typography;

type Props = {
  mode: 'create' | 'edit';
};

type FormValues = {
  title: string;
  year?: number;
  categoryId?: string;
  description?: string;
};

export function VideoFormPage({ mode }: Props) {
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm<FormValues>();
  const [categoryOptions, setCategoryOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const categories = await fetchCategories(false);
      const options = flattenCategories(categories).map((item) => ({
        value: item.id,
        label: item.name,
      }));
      if (!cancelled) setCategoryOptions(options);

      if (isEdit && id) {
        const video = await fetchVideoDetail(id);
        if (!cancelled) {
          form.setFieldsValue({
            title: video.title,
            year: video.year ?? undefined,
            categoryId: video.category?.id,
            description: video.description ?? undefined,
          });
        }
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [form, id, isEdit]);

  async function onFinish(values: FormValues) {
    try {
      if (isEdit && id) {
        await updateVideo(id, values);
        message.success('保存成功');
      } else {
        await createVideo(values);
        message.success('创建成功');
      }
      navigate('/admin/videos');
    } catch {
      message.error('保存失败');
    }
  }

  return (
    <Card>
      <Title level={4}>{isEdit ? '编辑视频' : '添加视频'}</Title>
      <Form form={form} layout="vertical" style={{ maxWidth: 720 }} onFinish={onFinish}>
        <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入视频标题' }]}>
          <Input placeholder="请输入视频标题" />
        </Form.Item>
        <Space size="middle" style={{ width: '100%' }}>
          <Form.Item label="年份" name="year" style={{ width: 180 }}>
            <InputNumber min={1900} max={2100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="分类" name="categoryId" style={{ width: 220 }}>
            <Select placeholder="选择分类" options={categoryOptions} allowClear />
          </Form.Item>
        </Space>
        <Form.Item label="简介" name="description">
          <Input.TextArea rows={5} placeholder="输入视频简介" />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          {isEdit ? '保存修改' : '创建视频'}
        </Button>
      </Form>
    </Card>
  );
}

function flattenCategories(
  list: Array<{
    id: string;
    name: string;
    children: unknown[];
  }>,
): Array<{ id: string; name: string }> {
  const result: Array<{ id: string; name: string }> = [];
  const walk = (
    nodes: Array<{
      id: string;
      name: string;
      children: unknown[];
    }>,
  ) => {
    for (const node of nodes) {
      result.push({ id: node.id, name: node.name });
      walk(node.children as Array<{ id: string; name: string; children: unknown[] }>);
    }
  };
  walk(list);
  return result;
}
