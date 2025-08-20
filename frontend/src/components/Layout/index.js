import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import './Layout.css';

const Layout = () => (
  <div className="layout">
    <Header />
    <main className="layout__content">
      <Outlet />
    </main>
  </div>
);

export default Layout;
