import React, { createContext, useContext, useState } from 'react';

interface AdminMenuValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const AdminMenuContext = createContext<AdminMenuValue | undefined>(undefined);

// Same reasoning as HeaderMenuContext on the owner side: a React Native
// Modal is a separate native window on Android, and showing one can leave
// the system navigation bar rendered solid black until the Modal closes.
// Avoiding Modal (trigger in the native header, dropdown content confined to
// the screen body) sidesteps that entirely.
export function AdminMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <AdminMenuContext.Provider value={{ isOpen, toggle: () => setIsOpen((v) => !v), close: () => setIsOpen(false) }}>
      {children}
    </AdminMenuContext.Provider>
  );
}

export function useAdminMenu(): AdminMenuValue {
  const ctx = useContext(AdminMenuContext);
  if (!ctx) throw new Error('useAdminMenu must be used within AdminMenuProvider');
  return ctx;
}
