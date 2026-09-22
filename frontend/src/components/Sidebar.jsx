import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getAuth, clearAuth } from '../utils/auth';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const auth = getAuth();
  const role = auth?.role;
  const brandName = 'Car Dealership System';
  const brandLogoUrl = `${process.env.PUBLIC_URL}/logo.svg`;

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    // Dashboard
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard', roles: ['admin'], section: 'Dashboard' },
    { path: '/admin/activities', icon: '🕒', label: 'Activity Panel', roles: ['admin'], section: 'Dashboard' },
    
    // Management
    { path: '/leads', icon: '👥', label: 'CRM & Leads', roles: ['admin', 'staff'], section: 'Management' },
    { path: '/vehicles', icon: '🚗', label: 'Vehicle Inventory', roles: ['admin', 'staff'], section: 'Management' },
    { path: '/sales', icon: '💰', label: 'Sales Transactions', roles: ['admin', 'staff'], section: 'Management' },
    { path: '/appointments', icon: '📅', label: 'Appointments', roles: ['admin', 'staff'], section: 'Management' },
    
    // Documents & Admin
    { path: '/documents', icon: '📄', label: 'Documents', roles: ['admin', 'staff'], section: 'Operations' },
    { path: '/events', icon: '📌', label: 'Events & Closures', roles: ['admin', 'staff'], section: 'Operations' },
    { path: '/admin/staff', icon: '👨‍💼', label: 'User & Role Management', roles: ['admin'], section: 'Admin' },
    { path: '/admin/create-staff', icon: '➕', label: 'Create New User', roles: ['admin'], section: 'Admin' },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));
  
  // Group items by section
  const groupedItems = {};
  filteredItems.forEach(item => {
    if (!groupedItems[item.section]) {
      groupedItems[item.section] = [];
    }
    groupedItems[item.section].push(item);
  });

  const getLinkClass = ({ isActive }) => `sideItem ${isActive ? 'active' : ''}`;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sideOverlay" onClick={onClose}></div>}

      <aside className={`side ${isOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sideBrand" onClick={() => { onClose(); window.location.href = '/'; }}>
          <img src={brandLogoUrl} alt={brandName} className="sideLogo" style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '8px' }} />
          <div className="sideBrandText">
            <h3>{brandName}</h3>
            <p>Dealer Operations</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sideNav">
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section} style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: 'rgba(255,255,255,.5)', 
                padding: '8px 16px', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px'
              }}>
                {section}
              </div>
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={getLinkClass}
                  onClick={onClose}
                >
                  <span className="sideItemIcon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sideFooter">
          <button
            onClick={handleLogout}
            className="sideLogout"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}
          >
            <span style={{ fontSize: '18px' }}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
