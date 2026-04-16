import { Button, Card, Form, Input, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import { register } from '../services/auth';

const { Title } = Typography;

type RegisterFormValues = {
  email: string;
  username: string;
  password: string;
};

export function RegisterPage() {
  const navigate = useNavigate();

  async function onFinish(values: RegisterFormValues) {
    try {
      await register(values);
      message.success('注册成功，请登录');
      navigate('/login');
    } catch {
      message.error('注册失败，请检查输入信息');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Title level={3}>奇点影视CMS 注册</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
                message: '至少8位，包含字母+数字',
              },
            ]}
          >
            <Input.Password placeholder="至少8位，包含字母+数字" />
          </Form.Item>
          <Button type="primary" block htmlType="submit">
            注册
          </Button>
          <Typography.Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
            已有账号？<Link to="/login">去登录</Link>
          </Typography.Paragraph>
        </Form>
      </Card>
    </div>
  );
}
