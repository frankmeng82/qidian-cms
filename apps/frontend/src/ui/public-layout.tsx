import { Layout, Menu, Typography } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/auth';

const { Header, Content } = Layout;

export function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.accessToken);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', paddingInline: 24 }}>
        <Typography.Text style={{ color: '#fff', marginRight: 24 }}>
          奇点影视
        </Typography.Text>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={[
            { key: '/', label: '首页' },
            { key: '/me', label: '用户中心' },
            { key: '/admin', label: '管理后台' },
            { key: token ? '/logout' : '/login', label: token ? '退出' : '登录' },
          ]}
        />
        <div style={{ marginLeft: 'auto' }}>
          {!token && (
            <Link to="/register" style={{ color: '#fff' }}>
              注册
            </Link>
          )}
        </div>
      </Header>
      <Content style={{ minHeight: 0 }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
