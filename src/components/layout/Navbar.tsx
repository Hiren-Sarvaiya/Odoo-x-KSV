import { Bell, ChevronDown, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { Role } from '../../types';

const roleBadgeColor: Record<Role, string> = {
  Admin: 'bg-rose-100 text-rose-700',
  'Procurement Officer': 'bg-blue-100 text-blue-700',
  Manager: 'bg-amber-100 text-amber-700',
  Vendor: 'bg-emerald-100 text-emerald-700',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const unread = notifs.filter((n) => !n.read).length;

  const loadNotifs = async () => {
    try {
      const n = await db.getNotifications();
      setNotifs(n.slice(0, 10));
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    loadNotifs();
    const iv = setInterval(loadNotifs, 15000);
    return () => clearInterval(iv);
  }, []);

  const markAllRead = async () => {
    try {
      await db.markAllRead();
      await loadNotifs();
    } catch (e) {
      console.error('Failed to mark notifications read:', e);
    }
  };
  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30 flex-shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <div className="relative">
          <button onClick={() => { setShowNotifs(!showNotifs); setShowUser(false); }} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
            <Bell className="w-5 h-5" />
            {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-800">Notifications</span>
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"><Check className="w-3 h-3" />Mark all read</button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? <p className="text-center text-gray-400 text-sm py-8">No notifications</p> :
                  notifs.map((n) => (
                    <div key={n.id} className={cn('px-4 py-3 border-b border-gray-50 hover:bg-gray-50', !n.read && 'bg-blue-50/50')}>
                      <p className={cn('text-sm', !n.read ? 'text-gray-800 font-medium' : 'text-gray-600')}>{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatTime(n.timestamp)}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => { setShowUser(!showUser); setShowNotifs(false); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">{user?.name?.[0] ?? 'U'}</div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', roleBadgeColor[user?.role ?? 'Admin'])}>{user?.role}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showUser && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1">
              <div className="px-4 py-2 border-b border-gray-100"><p className="text-sm font-medium text-gray-800">{user?.name}</p><p className="text-xs text-gray-500">{user?.email}</p></div>
              <button onClick={() => { logout(); navigate('/login'); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Sign out</button>
            </div>
          )}
        </div>
      </div>
      {(showNotifs || showUser) && <div className="fixed inset-0 z-40" onClick={() => { setShowNotifs(false); setShowUser(false); }} />}
    </header>
  );
}
