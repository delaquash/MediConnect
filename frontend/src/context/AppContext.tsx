// / contexts/AppContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axios from 'axios';

// Types
interface Doctor {
  _id: string;
  name: string;
  email: string;
  speciality: string;
  // add other doctor properties
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  // add other user properties
}

interface AppContextType {
  currencySymbol: string;
  backendUrl: string;
  token: string;
  setToken: (token: string) => void;
  logout: () => void;
}

// Create context for non-server state only
const AppContext = createContext<AppContextType | undefined>(undefined);

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
};

// API functions
const api = {
  getDoctors: async (backendUrl: string) => {
    const { data } = await axios.get(`${backendUrl}/api/doctor/list`);
    if (!data.success) {
      throw new Error(data.message);
    }
    return data.doctors;
  },

  getUserProfile: async (backendUrl: string, token: string) => {
    const { data } = await axios.get(`${backendUrl}/api/user/get-profile`, {
      headers: { token }
    });
    if (!data.success) {
      throw new Error(data.message);
    }
    return data.userData;
  }
};

// Custom hooks for server state
export const useDoctors = () => {
  const { backendUrl } = useAppContext();
  
  return useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.getDoctors(backendUrl),
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || 'Failed to fetch doctors');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUserProfile = () => {
  const { backendUrl, token } = useAppContext();
  
  return useQuery({
    queryKey: ['userProfile', token],
    queryFn: () => api.getUserProfile(backendUrl, token),
    enabled: !!token, // Only run if token exists
    error: (error: any) => {
      console.error(error);
    //   toast.error(error.message || 'Failed to fetch user profile');
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Custom hook for mutations
export const useUpdateUserProfile = () => {
  const { backendUrl, token } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: Partial<UserData>) => {
      const { data } = await axios.put(
        `${backendUrl}/api/user/update-profile`,
        userData,
        { headers: { token } }
      );
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.userData;
    },
    onSuccess: (userData: any) => {
      // Update the cache
      queryClient.setQueryData(['userProfile', token], userData);
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

// Context Provider - now only for client state
const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const currencySymbol = '₹';
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [token, setTokenState] = useState(
    localStorage.getItem('token') || ''
  );

  // Sync token with localStorage
  const setToken = (newToken: string) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  };

  const logout = () => {
    setToken('');
    // Optionally clear all queries on logout
    // queryClient.clear();
  };

  const value = {
    currencySymbol,
    backendUrl,
    token,
    setToken,
    logout,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;