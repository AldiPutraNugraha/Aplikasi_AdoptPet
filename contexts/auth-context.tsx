import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getUserProfile } from '@/lib/firebase/auth';
import { firebaseAuth } from '@/lib/firebase/client';
import type { AppUser } from '@/types/domain';

type AuthContextValue = {
  firebaseUser: User | null;
  profile: AppUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const currentUser = firebaseAuth.currentUser;

    if (!currentUser) {
      setProfile(null);
      return;
    }

    const nextProfile = await getUserProfile(currentUser.uid);

    if (firebaseAuth.currentUser?.uid === currentUser.uid) {
      setProfile(nextProfile);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let authRequestId = 0;

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      const requestId = ++authRequestId;
      setFirebaseUser(user);
      setLoading(true);
      try {
        const nextProfile = user ? await getUserProfile(user.uid) : null;

        if (active && requestId === authRequestId) {
          setProfile(nextProfile);
        }
      } finally {
        if (active && requestId === authRequestId) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      authRequestId += 1;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, profile, loading, refreshProfile }),
    [firebaseUser, loading, profile, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
