import { Button, Card, Form, Input, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import { login } from '../services/auth';
import { useAuthStore } from '../store/auth';

const { Title } = Typography;

type LoginFormValues = {
  email: string;
  password: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUsername = useAuthStore((state) => state.setUsername);

  async function onFinish(values: LoginFormValues) {
    try {
      const data = await login(values);
      setAccessToken(data.accessToken);
      setUsername(data.user.username);
      message.success('登录成功');
      navigate('/');
    } catch {
      message.error('登录失败，请检查账号或密码');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 380 }}>
        <Title level={3}>奇点影视CMS 登录</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Button type="primary" block htmlType="submit">
            登录
          </Button>
          <Typography.Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
            没有账号？<Link to="/register">去注册</Link>
          </Typography.Paragraph>
        </Form>
      </Card>
    </div>
  );
}
