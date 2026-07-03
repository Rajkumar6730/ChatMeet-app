// client/src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { 
  FiMessageSquare, 
  FiUsers, 
  FiUser, 
  FiSettings, 
  FiLogOut,
  FiX,
  FiSearch,
  FiBell,
  FiStar,
  FiMenu,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { chatService } from '../../services/chatService';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, updateUser } = useAuth();
  const { isConnected, emit, on, off } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ---- State ----
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ---- Fetch unread counts ----
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const chats = await chatService.getChats();
        const total = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        setUnreadCount(total);
      } catch (err) {
        console.error('Fetch unread counts error:', err);
      }
    };
    fetchUnreadCounts();
  }, []);

  // ---- Socket listeners for real-time updates ----
  useEffect(() => {
    if (!isConnected) return;

    const handleUnreadUpdate = (data) => {
      setUnreadCount(prev => prev + (data.unreadCount || 0));
    };

    const handleNewNotification = (data) => {
      setNotificationCount(prev => prev + (data.count || 1));
    };

    const handleNotificationRead = () => {
      setNotificationCount(0);
    };

    on('unreadCountUpdate', handleUnreadUpdate);
    on('newNotification', handleNewNotification);
    on('notificationRead', handleNotificationRead);

    return () => {
      off('unreadCountUpdate', handleUnreadUpdate);
      off('newNotification', handleNewNotification);
      off('notificationRead', handleNotificationRead);
    };
  }, [isConnected, on, off]);

  // ---- Handle logout ----
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ---- Handle status change ----
  const handleStatusChange = async (status) => {
    try {
      await chatService.updateStatus(status);
      updateUser({ status });
      setShowStatusMenu(false);
      if (isConnected) {
        emit('user:status', { userId: user._id, status });
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  // ---- Handle search ----
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearch(false);
      if (onClose) onClose();
    }
  };

  // ---- Navigation items (UPDATED with badges) ----
  const navItems = [
    { 
      to: '/chats', 
      icon: FiMessageSquare, 
      label: 'Chats',
      badge: unreadCount > 0 ? unreadCount : null,
      badgeColor: 'bg-primary'
    },
    { 
      to: '/groups', 
      icon: FiUsers, 
      label: 'Groups',
      badge: null
    },
    { 
      to: '/starred', 
      icon: FiStar, 
      label: 'Starred',
      badge: null
    },
    { 
      to: '/profile', 
      icon: FiUser, 
      label: 'Profile',
      badge: null
    },
    { 
      to: '/settings', 
      icon: FiSettings, 
      label: 'Settings',
      badge: null
    },
  ];

  // ---- Get status color ----
  const getStatusColor = (status) => {
    switch(status) {
      case 'online': return 'bg-status-online';
      case 'away': return 'bg-status-away';
      case 'offline': return 'bg-status-offline';
      default: return 'bg-status-offline';
    }
  };

  // ---- Get status label ----
  const getStatusLabel = (status) => {
    switch(status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Offline';
    }
  };

  // ---- Get user initials ----
  const getUserInitials = () => {
    if (!user?.username) return 'U';
    return user.username.charAt(0).toUpperCase();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 bg-card border-r border-border-color z-50 transform transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        <div className="flex flex-col h-full">
          {/* ---- Header (UPDATED) ---- */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-border-color`}>
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <FiMessageSquare className="text-white text-xl" />
                </div>
                <span className="text-xl font-bold text-text">ChatApp</span>
              </div>
            )}
            {isCollapsed && (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <FiMessageSquare className="text-white text-xl" />
              </div>
            )}
            <div className="flex items-center gap-1">
              {!isCollapsed && (
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-2 text-text-secondary hover:text-text hover:bg-background rounded-full transition"
                  title="Search"
                >
                  <FiSearch size={18} />
                </button>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 text-text-secondary hover:text-text hover:bg-background rounded-full transition hidden md:block"
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? <FiMenu size={18} /> : <FiChevronDown size={18} />}
              </button>
              <button
                onClick={onClose}
                className="md:hidden p-2 text-text-secondary hover:text-text hover:bg-background rounded-full transition"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          {/* ---- Search Bar (NEW FEATURE) ---- */}
          {showSearch && !isCollapsed && (
            <div className="p-3 border-b border-border-color">
              <form onSubmit={handleSearch} className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-background border border-border-color rounded-12 py-2 pl-10 pr-4 text-text focus:outline-none focus:border-primary"
                  autoFocus
                />
              </form>
            </div>
          )}

          {/* ---- User Info (UPDATED) ---- */}
          <div className={`p-4 border-b border-border-color ${isCollapsed ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-3'}`}>
              <div className="relative flex-shrink-0">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user?.username}
                    className={`rounded-full object-cover border-2 border-border-color ${
                      isCollapsed ? 'w-12 h-12' : 'w-12 h-12'
                    }`}
                  />
                ) : (
                  <div className={`rounded-full bg-primary flex items-center justify-center text-white font-bold ${
                    isCollapsed ? 'w-12 h-12 text-lg' : 'w-12 h-12 text-lg'
                  }`}>
                    {getUserInitials()}
                  </div>
                )}
                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card ${getStatusColor(user?.status || 'offline')}`} />
              </div>
              
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-text font-medium truncate">{user?.username || 'User'}</p>
                    <button
                      onClick={() => setShowStatusMenu(!showStatusMenu)}
                      className="text-text-secondary hover:text-text"
                    >
                      <FiChevronDown size={16} />
                    </button>
                  </div>
                  <p className="text-text-secondary text-sm flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(user?.status || 'offline')}`} />
                    {getStatusLabel(user?.status || 'offline')}
                  </p>
                </div>
              )}
            </div>

            {/* ---- Status Menu (NEW FEATURE) ---- */}
            {showStatusMenu && !isCollapsed && (
              <div className="absolute left-0 right-0 mt-2 mx-4 bg-card border border-border-color rounded-12 shadow-lg z-50">
                {['online', 'away', 'offline'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`w-full px-4 py-2 text-left hover:bg-background transition flex items-center gap-3 ${
                      user?.status === status ? 'bg-primary/10' : ''
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status)}`} />
                    <span className="text-text capitalize">{status}</span>
                    {user?.status === status && (
                      <span className="ml-auto text-primary text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---- Navigation (UPDATED) ---- */}
          <nav className={`flex-1 p-3 space-y-1 overflow-y-auto ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-12 transition ${
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-text-secondary hover:bg-background hover:text-text'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
                onClick={onClose}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon size={20} />
                {!isCollapsed && (
                  <>
                    <span className="font-medium flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`${item.badgeColor} text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.badge && (
                  <span className={`${item.badgeColor} text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[16px] text-center absolute -top-1 -right-1`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* ---- Footer (UPDATED) ---- */}
          <div className={`p-4 border-t border-border-color ${isCollapsed ? 'flex justify-center' : ''}`}>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-4 py-3 rounded-12 text-red-500 hover:bg-red-500/10 transition ${
                isCollapsed ? 'justify-center w-12' : 'w-full'
              }`}
              title={isCollapsed ? 'Logout' : ''}
            >
              <FiLogOut size={20} />
              {!isCollapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;