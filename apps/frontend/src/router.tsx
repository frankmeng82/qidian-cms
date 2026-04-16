import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { CategoryPage } from './pages/category';
import { CategoryManagePage } from './pages/category-manage';
import { CollectManagePage } from './pages/collect-manage';
import { DashboardPage } from './pages/dashboard';
import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { LogoutPage } from './pages/logout';
import { PlayPage } from './pages/play';
import { PublicVideoDetailPage } from './pages/public-video-detail';
import { RegisterPage } from './pages/register';
import { SearchPage } from './pages/search';
import { UserCenterPage } from './pages/user-center';
import { VideoDetailPage } from './pages/video-detail';
import { VideoFormPage } from './pages/video-form';
import { VideoListPage } from './pages/video-list';
import { useAuthStore } from './store/auth';
import { MainLayout } from './ui/main-layout';
import { PublicLayout } from './ui/public-layout';

function ProtectedRoute({ children }: { children: ReactElement }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicAuthRoute({ children }: { children: ReactElement }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  if (accessToken) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/logout" element={<LogoutPage />} />
      <Route
        path="/login"
        element={
          <PublicAuthRoute>
            <LoginPage />
          </PublicAuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicAuthRoute>
            <RegisterPage />
          </PublicAuthRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="videos" element={<VideoListPage />} />
        <Route path="videos/new" element={<VideoFormPage mode="create" />} />
        <Route path="videos/:id/edit" element={<VideoFormPage mode="edit" />} />
        <Route path="videos/:id" element={<VideoDetailPage />} />
        <Route path="categories" element={<CategoryManagePage />} />
        <Route path="collect" element={<CollectManagePage />} />
      </Route>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="category/:id" element={<CategoryPage />} />
        <Route path="video/:id" element={<PublicVideoDetailPage />} />
        <Route path="play/:id" element={<PlayPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route
          path="me"
          element={
            <ProtectedRoute>
              <UserCenterPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
