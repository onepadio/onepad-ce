import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  username: string;
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthenticator() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthenticator must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state from localStorage or API
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Validate token with your API and get user info
          // const userData = await validateToken(token);
          // setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Implement your sign-in logic here
      // const response = await API.post('userApi', '/auth/signin', {
      //   body: { email, password }
      // });
      // const { token, user } = response;
      // localStorage.setItem('authToken', token);
      // setUser(user);
      
      // Temporary mock for migration
      throw new Error('Sign-in not implemented - replace with your auth API');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Implement sign-out logic
      localStorage.removeItem('authToken');
      setUser(null);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  const signUp = async (email: string, password: string, username: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Implement your sign-up logic here
      // const response = await API.post('userApi', '/auth/signup', {
      //   body: { email, password, username }
      // });
      
      // Temporary mock for migration
      throw new Error('Sign-up not implemented - replace with your auth API');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    signIn,
    signOut,
    signUp,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Compatibility wrapper for AWS Amplify components
export function withAuthenticator(Component: React.ComponentType<any>) {
  return function AuthenticatedComponent(props: any) {
    const { user, signOut } = useAuthenticator();
    
    if (!user) {
      // Return your login component
      return <div>Please implement your login component here</div>;
    }

    return <Component {...props} user={user} signOut={signOut} />;
  };
}
