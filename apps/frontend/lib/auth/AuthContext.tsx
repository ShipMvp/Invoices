import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Navigate } from 'react-router-dom';
import { AuthService } from '../api/auth-service';
import type { LoginDto, AuthResultDto, UserDto } from '../../types/auth';

interface AuthContextType {
  user: UserDto | null;
  login: (credentials: LoginDto) => Promise<AuthResultDto>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on app load
    const initializeAuth = async () => {
      const savedUser = AuthService.getUser();
      const token = AuthService.getToken();

      if (savedUser && token) {
        setUser(savedUser);
      } else if (savedUser && !token) {
        // Token expired, try to refresh
        try {
          const refreshResult = await AuthService.refreshToken();
          if (refreshResult && refreshResult.success && refreshResult.user) {
            setUser(refreshResult.user);
          } else {
            AuthService.clearAuth();
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          AuthService.clearAuth();
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginDto): Promise<AuthResultDto> => {
    setIsLoading(true);
    try {
      const result = await AuthService.login(credentials);
      console.log('Login result:', result);
      if (result.success && result.user) {
        console.log('Setting user:', result.user);
        setUser(result.user);
        return result;
      } else {
        // Login failed, throw an error to be caught by the component
        const errorMessage = result.errorMessage || 'Invalid email or password';
        throw new Error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected Route Component
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: string;
}

export function ProtectedRoute({
  children,
  fallback = '/auth/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
