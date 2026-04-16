import { VideoCameraOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Space, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/auth';

const { Header, Sider, Content } = Layout;

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = useAuthStore((state) => state.username);
  const reset = useAuthStore((state) => state.reset);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ color: '#fff', padding: '16px', fontWeight: 600 }}>Qidian CMS</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={[
            { key: '/admin', icon: <VideoCameraOutlined />, label: '控制台' },
            { key: '/admin/videos', icon: <VideoCameraOutlined />, label: '视频管理' },
            { key: '/admin/categories', icon: <VideoCameraOutlined />, label: '分类管理' },
            { key: '/admin/collect', icon: <VideoCameraOutlined />, label: '采集管理' },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingInline: 24,
          }}
        >
          <Typography.Text strong>奇点影视CMS</Typography.Text>
          <Space>
            <Typography.Text type="secondary">{username ?? '管理员'}</Typography.Text>
            <Button
              onClick={() => {
                reset();
                navigate('/login');
              }}
            >
              退出登录
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
