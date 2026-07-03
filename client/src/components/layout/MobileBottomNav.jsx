import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiMessageSquare, FiUsers, FiUser, FiSettings } from 'react-icons/fi';

const MobileBottomNav = () => {
  const navItems = [
    { to: '/chats', icon: FiMessageSquare, label: 'Chats' },
    { to: '/groups', icon: FiUsers, label: 'Groups' },
    { to: '/profile', icon: FiUser, label: 'Profile' },
    { to: '/settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <nav className="md:hidden bg-header-bg border-t border-border-color px-4 py-2 flex items-center justify-around">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 rounded-12 transition ${
              isActive ? 'text-primary' : 'text-text-secondary hover:text-text'
            }`
          }
        >
          <item.icon size={22} />
          <span className="text-xs">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileBottomNav;