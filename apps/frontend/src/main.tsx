import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AppBootstrap } from './app-bootstrap';
import { AppRouter } from './router';
import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppBootstrap />
      <AppRouter />
    </BrowserRouter>
  </React.StrictMode>,
);
