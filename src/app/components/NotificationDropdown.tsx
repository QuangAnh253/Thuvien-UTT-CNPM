import { useState } from 'react';
import { Bell, Clock, CheckCircle, AlertCircle, XCircle, BookOpen, Users, FileText } from 'lucide-react';
import { Link } from 'react-router';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon: 'book' | 'user' | 'file' | 'check' | 'alert' | 'error';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link?: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onViewAll?: () => void;
}

export default function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAll,
}: NotificationDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-blue-50 border-blue-200 text-[#262262]';
    }
  };

  const getIconComponent = (iconType: Notification['icon'], type: Notification['type']) => {
    const colorClass = type === 'success' ? 'text-green-600' :
                      type === 'warning' ? 'text-yellow-600' :
                      type === 'error' ? 'text-red-600' :
                      'text-[#262262]';

    switch (iconType) {
      case 'book':
        return <BookOpen className={`w-5 h-5 ${colorClass}`} />;
      case 'user':
        return <Users className={`w-5 h-5 ${colorClass}`} />;
      case 'file':
        return <FileText className={`w-5 h-5 ${colorClass}`} />;
      case 'check':
        return <CheckCircle className={`w-5 h-5 ${colorClass}`} />;
      case 'alert':
        return <AlertCircle className={`w-5 h-5 ${colorClass}`} />;
      case 'error':
        return <XCircle className={`w-5 h-5 ${colorClass}`} />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (onMarkAsRead && !notification.isRead) {
      onMarkAsRead(notification.id);
    }
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-[#f79421] text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowDropdown(false)}
          ></div>

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-40 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-[#262262] font-semibold">Thông báo</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">{unreadCount} chưa đọc</p>
                )}
              </div>
              {unreadCount > 0 && onMarkAllAsRead && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-sm text-[#f79421] hover:text-[#e67d0f] transition-colors"
                >
                  Đánh dấu tất cả
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Không có thông báo mới</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const content = (
                      <div
                        className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.isRead ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className="flex-shrink-0 mt-0.5">
                            {getIconComponent(notification.icon, notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-[#262262]">
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-[#f79421] rounded-full flex-shrink-0 mt-1.5"></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{notification.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                    if (notification.link) {
                      return (
                        <Link
                          key={notification.id}
                          to={notification.link}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {content}
                        </Link>
                      );
                    } else {
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {content}
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 text-center">
                <button
                  className="text-sm text-[#f79421] hover:text-[#e67d0f] transition-colors font-semibold"
                  onClick={() => {
                    setShowAllModal(true);
                    setShowDropdown(false);
                  }}
                >
                  Xem tất cả thông báo
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showAllModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowAllModal(false)}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 max-h-[80vh] flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-[#262262] font-semibold">Tất cả thông báo</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{notifications.length} thông báo</p>
                </div>
                <button
                  className="text-sm text-gray-500 hover:text-gray-700"
                  onClick={() => setShowAllModal(false)}
                >
                  Đóng
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Không có thông báo</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => {
                      const content = (
                        <div
                          className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notification.isRead ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getIconComponent(notification.icon, notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-[#262262]">
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-[#f79421] rounded-full flex-shrink-0 mt-1.5"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{notification.time}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );

                      if (notification.link) {
                        return (
                          <Link
                            key={notification.id}
                            to={notification.link}
                            onClick={() => {
                              handleNotificationClick(notification);
                              setShowAllModal(false);
                            }}
                          >
                            {content}
                          </Link>
                        );
                      }

                      return (
                        <div
                          key={notification.id}
                          onClick={() => {
                            handleNotificationClick(notification);
                            setShowAllModal(false);
                          }}
                        >
                          {content}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-t border-gray-200 text-right">
                {unreadCount > 0 && onMarkAllAsRead && (
                  <button
                    className="text-sm text-[#f79421] hover:text-[#e67d0f] transition-colors font-semibold"
                    onClick={onMarkAllAsRead}
                  >
                    Đánh dấu tất cả
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
