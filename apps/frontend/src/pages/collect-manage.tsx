import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import {
  createCollectRule,
  executeCollectRule,
  fetchCollectLogs,
  fetchCollectRules,
} from '../services/collect';

type Rule = {
  id: string;
  name: string;
  sourceUrl: string;
  sourceType: string;
  cronExpr: string | null;
  maxItems: number;
  minIntervalMs: number;
  status: number;
};

type CollectLogItem = {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  rule: { id: string; name: string };
  created: number;
  skipped: number;
  failed: number;
};

export function CollectManagePage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [logs, setLogs] = useState<CollectLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const [ruleData, logData] = await Promise.all([fetchCollectRules(), fetchCollectLogs()]);
      setRules(ruleData);
      setLogs(logData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const ruleColumns = useMemo(
    () => [
      { title: '规则名', dataIndex: 'name' as const },
      { title: '来源', dataIndex: 'sourceType' as const },
      { title: '地址', dataIndex: 'sourceUrl' as const },
      { title: '最大条数', dataIndex: 'maxItems' as const },
      {
        title: '操作',
        render: (_: unknown, record: Rule) => (
          <Button
            size="small"
            onClick={async () => {
              try {
                await executeCollectRule({ ruleId: record.id });
                message.success('任务已加入队列');
                await reload();
              } catch {
                message.error('执行失败');
              }
            }}
          >
            立即执行
          </Button>
        ),
      },
    ],
    [],
  );

  const logColumns = useMemo(
    () => [
      { title: '规则', render: (_: unknown, record: CollectLogItem) => record.rule.name },
      {
        title: '状态',
        render: (_: unknown, record: CollectLogItem) => (
          <Tag color={record.status === 'success' ? 'green' : record.status === 'failed' ? 'red' : 'gold'}>
            {record.status}
          </Tag>
        ),
      },
      { title: '结果', render: (_: unknown, record: CollectLogItem) => record.message ?? '-' },
      {
        title: '新增/跳过/失败',
        render: (_: unknown, record: CollectLogItem) =>
          `${record.created}/${record.skipped}/${record.failed}`,
      },
      { title: '时间', dataIndex: 'createdAt' as const },
    ],
    [],
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card title="新增采集规则">
        <Form
          layout="inline"
          onFinish={async (values) => {
            try {
              await createCollectRule(values);
              message.success('规则创建成功');
              await reload();
            } catch {
              message.error('创建失败');
            }
          }}
        >
          <Form.Item name="name" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="规则名称" />
          </Form.Item>
          <Form.Item name="sourceUrl" rules={[{ required: true, message: '请输入采集地址' }]}>
            <Input placeholder="https://..." style={{ width: 320 }} />
          </Form.Item>
          <Form.Item name="sourceType" initialValue="xml">
            <Select
              options={[
                { value: 'xml', label: 'XML' },
                { value: 'json', label: 'JSON' },
              ]}
              style={{ width: 90 }}
            />
          </Form.Item>
          <Form.Item name="maxItems" initialValue={100}>
            <InputNumber min={1} max={100} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              创建
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Card title="规则列表">
        <Table rowKey="id" loading={loading} dataSource={rules} columns={ruleColumns} pagination={false} />
      </Card>
      <Card title="采集日志">
        <Table rowKey="id" dataSource={logs} columns={logColumns} pagination={{ pageSize: 10 }} />
      </Card>
    </Space>
  );
}
