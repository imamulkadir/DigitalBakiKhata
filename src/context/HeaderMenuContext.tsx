import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAnnouncements, Announcement } from '../hooks/useAnnouncements';

type ActiveMenu = 'none' | 'account' | 'notifications';
type NotifView = 'list' | 'detail';

interface HeaderMenuValue {
  activeMenu: ActiveMenu;
  toggleMenu: (menu: ActiveMenu) => void;
  closeMenu: () => void;
  announcements: Announcement[];
  unreadCount: number;
  notifView: NotifView;
  selected: Announcement | null;
  openDetail: (a: Announcement) => void;
  markAllRead: () => void;
}

const HeaderMenuContext = createContext<HeaderMenuValue | undefined>(undefined);

// Single source of truth for the Home header's two dropdown menus (account,
// notifications), shared between the trigger icons (rendered in the native
// header via headerRight) and the dropdown content (rendered in the screen
// body). Kept as context rather than component-local state because those two
// places are genuinely different parts of the native-stack view hierarchy.
export function HeaderMenuProvider({ ownerId, children }: { ownerId: string; children: React.ReactNode }) {
  const { announcements, fetchAnnouncements, markRead, markAllRead } = useAnnouncements(ownerId);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('none');
  const [notifView, setNotifView] = useState<NotifView>('list');
  const [selected, setSelected] = useState<Announcement | null>(null);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  function toggleMenu(menu: ActiveMenu) {
    if (activeMenu === menu) {
      setActiveMenu('none');
      return;
    }
    if (menu === 'notifications') {
      setNotifView('list');
      fetchAnnouncements();
    }
    setActiveMenu(menu);
  }

  function closeMenu() {
    setActiveMenu('none');
  }

  async function openDetail(a: Announcement) {
    setSelected(a);
    setNotifView('detail');
    if (!a.is_read) await markRead(a.id);
  }

  const unreadCount = announcements.filter((a) => !a.is_read).length;

  return (
    <HeaderMenuContext.Provider
      value={{ activeMenu, toggleMenu, closeMenu, announcements, unreadCount, notifView, selected, openDetail, markAllRead }}
    >
      {children}
    </HeaderMenuContext.Provider>
  );
}

export function useHeaderMenu(): HeaderMenuValue {
  const ctx = useContext(HeaderMenuContext);
  if (!ctx) throw new Error('useHeaderMenu must be used within HeaderMenuProvider');
  return ctx;
}
