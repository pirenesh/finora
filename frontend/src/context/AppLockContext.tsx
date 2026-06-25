import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppLockContextType {
  isAppUnlocked: boolean;
  isProfileUnlocked: boolean;
  unlockApp: () => void;
  lockApp: () => void;
  unlockProfile: () => void;
  lockProfile: () => void;
}

const AppLockContext = createContext<AppLockContextType>({
  isAppUnlocked: false,
  isProfileUnlocked: false,
  unlockApp: () => {},
  lockApp: () => {},
  unlockProfile: () => {},
  lockProfile: () => {},
});

export const useAppLock = () => useContext(AppLockContext);

export const AppLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start locked by default when the app loads
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [isProfileUnlocked, setIsProfileUnlocked] = useState(false);

  // Re-lock profile when navigating away (optional, but good security practice)
  // We'll manage this at the component level for now.

  const unlockApp = () => setIsAppUnlocked(true);
  const lockApp = () => setIsAppUnlocked(false);
  
  const unlockProfile = () => setIsProfileUnlocked(true);
  const lockProfile = () => setIsProfileUnlocked(false);

  return (
    <AppLockContext.Provider value={{
      isAppUnlocked,
      isProfileUnlocked,
      unlockApp,
      lockApp,
      unlockProfile,
      lockProfile
    }}>
      {children}
    </AppLockContext.Provider>
  );
};
