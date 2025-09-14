import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaBox, 
  FaReceipt, 
  FaUserShield,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUser
} from 'react-icons/fa';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      path: '/dashboard',
      icon: FaTachometerAlt,
      label: 'Dashboard',
      color: '#007bff'
    },
    {
      path: '/admin-management',
      icon: FaUserShield,
      label: 'Admin Management',
      color: '#28a745'
    },
    {
      path: '/products',
      icon: FaBox,
      label: 'Product Management',
      color: '#ffc107'
    },
    {
      path: '/users',
      icon: FaUsers,
      label: 'User Management',
      color: '#17a2b8'
    },
    {
      path: '/transactions',
      icon: FaReceipt,
      label: 'Transaction Management',
      color: '#6f42c1'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/assets/logo.svg" alt="Mall Marketing Logo" className="admin-logo" />
            <h2>Admin Panel</h2>
          </div>
          <button className="sidebar-close" onClick={closeSidebar}>
            <FaTimes />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
                style={{ '--item-color': item.color }}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="sidebar-footer">
          <div className="admin-info">
            <FaUser className="admin-avatar" />
            <div className="admin-details">
              <span className="admin-name">{admin?.username ? admin.username.charAt(0).toUpperCase() + admin.username.slice(1) : 'Admin'}</span>
              <span className="admin-email">{admin?.email}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
          
          <div className="header-title">
            <h1>{menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}</h1>
          </div>
          
          <div className="header-actions">
            <div className="admin-profile">
              <FaUser className="profile-icon" />
              <span className="profile-name">{admin?.username ? admin.username.charAt(0).toUpperCase() + admin.username.slice(1) : 'Admin'}</span>
            </div>
            <button className="logout-btn-header" onClick={handleLogout}>
              <FaSignOutAlt />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
    </div>
  );
};

export default Layout;
