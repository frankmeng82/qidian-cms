import { Button, Card, Form, Input, InputNumber, Space, Table, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { createCategory, deleteCategory, fetchCategories } from '../services/category';
import type { CategoryNode } from '../types/category';

export function CategoryManagePage() {
  const [items, setItems] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<{ name: string; sortOrder?: number }>();

  async function reload() {
    setLoading(true);
    try {
      const data = await fetchCategories(false);
      setItems(flattenTree(data));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const columns = useMemo(
    () => [
      { title: '名称', dataIndex: 'name' as const },
      { title: '排序', dataIndex: 'sortOrder' as const },
      { title: '内容数', dataIndex: 'videoCount' as const },
      {
        title: '操作',
        render: (_: unknown, record: CategoryNode) => (
          <Button
            danger
            size="small"
            onClick={async () => {
              try {
                await deleteCategory(record.id);
                message.success('删除成功');
                await reload();
              } catch (error) {
                message.error(error instanceof Error ? error.message : '删除失败');
              }
            }}
          >
            删除
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card title="新增分类">
        <Form
          form={form}
          layout="inline"
          onFinish={async (values) => {
            try {
              await createCategory(values);
              message.success('创建成功');
              form.resetFields();
              await reload();
            } catch {
              message.error('创建失败');
            }
          }}
        >
          <Form.Item name="name" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="分类名称" />
          </Form.Item>
          <Form.Item name="sortOrder">
            <InputNumber min={0} placeholder="排序" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              创建
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Card title="分类列表">
        <Table rowKey="id" loading={loading} dataSource={items} columns={columns} pagination={false} />
      </Card>
    </Space>
  );
}

function flattenTree(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  const walk = (list: CategoryNode[]) => {
    for (const item of list) {
      result.push(item);
      walk(item.children);
    }
  };
  walk(nodes);
  return result;
}
