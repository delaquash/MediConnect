import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axios from 'axios';

// Types
interface Doctor {
  _id: string;
  name: string;
  email: string;
  speciality: string;
  image: string;
  degree: string;
  experience: string;
  about: string;
  fees: number;
  address: {
    line1: string;
    line2: string;
  };
  available: boolean;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
  };
  gender: string;
  dob: string;
  image: string;
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

// API functions with proper typing
const api = {
  getDoctors: async (backendUrl: string): Promise<Doctor[]> => {
    const { data } = await axios.get(`${backendUrl}/doctor/list`);
    if (!data.success) {
      throw new Error(data.message);
    }
    return data.doctors;
  },

  getUserProfile: async (backendUrl: string, token: string): Promise<UserData> => {
    const { data } = await axios.get(`${backendUrl}/user/get-profile`, {
      headers: { token }
    });
    if (!data.success) {
      throw new Error(data.message);
    }
    return data?.userData;
  }
};

export const useDoctors = (): UseQueryResult<Doctor[], Error> => {
  const { backendUrl } = useAppContext();
  
  return useQuery<Doctor[], Error>({
    queryKey: ['doctors'],
    queryFn: () => api.getDoctors(backendUrl),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
  });
};

export const useUserProfile = (): UseQueryResult<UserData, Error> => {
  const { backendUrl, token } = useAppContext();
  
  return useQuery<UserData, Error>({
    queryKey: ['userProfile', token],
    queryFn: () => api.getUserProfile(backendUrl, token),
    enabled: !!token, // Only run if token exists
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};


export const useDoctorsWithErrorHandling = () => {
  const { backendUrl } = useAppContext();
  
  const query = useQuery<Doctor[], Error>({
    queryKey: ['doctors'],
    queryFn: () => api.getDoctors(backendUrl),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Handle errors separately
  useEffect(() => {
    if (query.error) {
      console.error(query.error);
      toast.error(query.error.message || 'Failed to fetch doctors');
    }
  }, [query.error]);

  return query;
};

// Custom hook for mutations
export const useUpdateUserProfile = () => {
  const { backendUrl, token } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation<UserData, Error, Partial<UserData>>({
    mutationFn: async (userData: Partial<UserData>) => {
      const { data } = await axios.put(
        `${backendUrl}/user/update-profile`,
        userData,
        { headers: { token } }
      );
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.userData;
    },
    onSuccess: (userData) => {
      // Update the cache
      queryClient.setQueryData(['userProfile', token], userData);
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      console.error(error);
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

// Book appointment mutation
export const useBookAppointment = () => {
  const { backendUrl, token } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation<any, Error, { doctorId: string; slotDate: string; slotTime: string }>({
    mutationFn: async ({ doctorId, slotDate, slotTime }) => {
      const { data } = await axios.post(
        `${backendUrl}/user/book-appointment`,
        { doctorId, slotDate, slotTime },
        { headers: { token } }
      );
      if (!data.success) {
        throw new Error(data.message);
      }
      return data;
    },
    onSuccess: () => {
      // Invalidate appointments query to refetch
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment booked successfully');
    },
    onError: (error: Error) => {
      console.error(error);
      toast.error(error.message || 'Failed to book appointment');
    },
  });
};

// Context Provider - now only for client state
const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
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
    // Clear all queries on logout
    queryClient.clear();
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