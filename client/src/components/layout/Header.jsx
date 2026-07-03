// client/src/components/layout/Header.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FiMenu, 
  FiBell, 
  FiSearch, 
  FiMoreVertical, 
  FiCamera,
  FiX,
  FiChevronLeft,
  FiUser,
  FiLogOut,
  FiSettings,
  FiMessageSquare,
  FiUsers,
  FiStar
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { chatService } from '../../services/chatService';

const Header = ({ 
  onMenuClick, 
  onSearchClick, 
  showBackButton = false, 
  onBack 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isConnected, on, off } = useSocket();
  
  // ---- State ----
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ---- Get page title ----
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/chats' || path === '/') return 'Chats';
    if (path.includes('/groups')) return 'Groups';
    if (path.includes('/profile')) return 'Profile';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/starred')) return 'Starred';
    if (path.includes('/search')) return 'Search';
    return 'ChatApp';
  };

  // ---- Get page icon ----
  const getPageIcon = () => {
    const path = location.pathname;
    if (path === '/chats' || path === '/') return FiMessageSquare;
    if (path.includes('/groups')) return FiUsers;
    if (path.includes('/profile')) return FiUser;
    if (path.includes('/settings')) return FiSettings;
    if (path.includes('/starred')) return FiStar;
    return FiMessageSquare;
  };

  // ---- Fetch notifications ----
  useEffect(() => {
    const fetchNotifications = async () => {
        try {
           // Check if method exists before calling
            const data = await chatService.getNotifications();
            setNotifications(data || []);
            const unread = (data || []).filter(n => !n.isRead).length;
            setNotificationCount(unread);
        } catch (err) {
            console.error('Fetch notifications error:', err);
            // Set empty state to avoid breaking UI
            setNotifications([]);
            setNotificationCount(0);
        }
    };
    fetchNotifications();
}, []);

// ---- Socket listeners for notifications ----
  useEffect(() => {
    if (!isConnected) return;

    const handleNewNotification = (data) => {
      setNotificationCount(prev => prev + 1);
      setNotifications(prev => [data, ...prev]);
    };

    const handleNotificationRead = (data) => {
      setNotifications(prev => 
        prev.map(n => (n._id || n.id) === (data._id || data.id) ? { ...n, isRead: true } : n)
      );
      setNotificationCount(prev => Math.max(0, prev - 1));
    };

    on('newNotification', handleNewNotification);
    on('notificationRead', handleNotificationRead);

    return () => {
      off('newNotification', handleNewNotification);
      off('notificationRead', handleNotificationRead);
    };
  }, [isConnected, on, off]);

  // ---- Handle search ----
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  // ---- Handle notification click ----
  const handleNotificationClick = (notification) => {
    setShowNotifications(false);
    if (notification.data?.chatId) {
      navigate(`/chats/${notification.data.chatId}`);
    } else if (notification.data?.groupId) {
      navigate(`/groups/${notification.data.groupId}`);
    }
    // Mark as read if method exists
    if (typeof chatService.markNotificationAsRead === 'function') {
      chatService.markNotificationAsRead(notification._id || notification.id);
    }
  };

  // ---- Handle mark all as read ----
  const handleMarkAllAsRead = async () => {
    try {
      if (typeof chatService.markAllNotificationsAsRead === 'function') {
        await chatService.markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setNotificationCount(0);
      }
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  };

  // ---- Get time ago ----
  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const PageIcon = getPageIcon();

  return (
    <>
      <header className="bg-header-bg border-b border-border-color px-4 py-3 flex items-center justify-between flex-shrink-0">
        {/* ---- Left section ---- */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="md:hidden text-text-secondary hover:text-text p-1 rounded-full hover:bg-background transition"
            aria-label="Toggle sidebar"
          >
            <FiMenu size={24} />
          </button>

          {/* Back button */}
          {showBackButton && (
            <button
              onClick={onBack}
              className="text-text-secondary hover:text-text p-1 rounded-full hover:bg-background transition"
              aria-label="Go back"
            >
              <FiChevronLeft size={24} />
            </button>
          )}

          {/* Page title with icon */}
          <div className="flex items-center gap-2">
            <PageIcon className="text-primary text-xl hidden md:block" size={20} />
            <h1 className="text-xl font-semibold text-text">{getPageTitle()}</h1>
          </div>

          {/* Connection status */}
          <div className="hidden md:flex items-center gap-2 ml-4">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-status-online' : 'bg-status-offline'}`} />
            <span className="text-text-secondary text-sm">{isConnected ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* ---- Right section ---- */}
        <div className="flex items-center gap-1">
          {/* Search button */}
          <button
            onClick={() => {
              if (onSearchClick) {
                onSearchClick();
              } else {
                setShowSearch(!showSearch);
              }
            }}
            className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition"
            aria-label="Search"
          >
            <FiSearch size={20} />
          </button>

          {/* Camera button */}
          <button 
            className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition"
            aria-label="Camera"
          >
            <FiCamera size={20} />
          </button>

          {/* Notifications button with badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition relative"
              aria-label="Notifications"
            >
              <FiBell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 bg-card border border-border-color rounded-12 shadow-lg z-50 overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-border-color">
                  <h3 className="text-text font-semibold">Notifications</h3>
                  {notificationCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-primary hover:text-secondary transition"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto max-h-72">
                  {notifications.length === 0 ? (
                    <div className="text-center text-text-secondary py-8">
                      <FiBell className="mx-auto text-3xl mb-2 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id || notification.id || Math.random().toString()}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 border-b border-border-color hover:bg-background cursor-pointer transition ${
                          !notification.isRead ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {notification.data?.senderId && (
                            <img
                              src={notification.data?.senderProfilePicture || '/default-avatar.png'}
                              alt="Sender"
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-text text-sm font-medium truncate">
                              {notification.title}
                            </p>
                            <p className="text-text-secondary text-sm truncate">
                              {notification.body}
                            </p>
                            <span className="text-text-secondary text-xs">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* More options button */}
          <button 
            className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition"
            aria-label="More options"
          >
            <FiMoreVertical size={20} />
          </button>

          {/* User avatar */}
          <div className="hidden md:block ml-2 relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="focus:outline-none"
            >
              <img
                src={user?.profilePicture || '/default-avatar.png'}
                alt={user?.username}
                className="w-8 h-8 rounded-full object-cover border-2 border-transparent hover:border-primary transition"
              />
            </button>

            {/* Profile dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border-color rounded-12 shadow-lg z-50 overflow-hidden">
                <div className="p-3 border-b border-border-color">
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.profilePicture || '/default-avatar.png'}
                      alt={user?.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-text font-medium truncate">{user?.username}</p>
                      <p className="text-text-secondary text-sm">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-8 text-text hover:bg-background transition"
                  >
                    <FiUser size={16} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-8 text-text hover:bg-background transition"
                  >
                    <FiSettings size={16} />
                    <span>Settings</span>
                  </button>
                  <div className="border-t border-border-color my-1" />
                  <button
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-8 text-red-500 hover:bg-red-500/10 transition"
                  >
                    <FiLogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search bar inline */}
      {showSearch && (
        <div className="bg-header-bg border-b border-border-color px-4 py-2 animate-slideDown">
          <form onSubmit={handleSearch} className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages, contacts, groups..."
              className="w-full bg-background border border-border-color rounded-12 py-2 pl-10 pr-10 text-text focus:outline-none focus:border-primary"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text"
            >
              <FiX size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Header;