import { useQuery, useMutation, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useNavigate } from "@tanstack/react-router";
import axios from "axios";
import { api, useAppContext } from "../context/AppContext";

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


// login custom hooks
  export const useLogin = ()=> {
    const navigate = useNavigate()
    const { backendUrl, setToken } = useAppContext()
    const queryClient = useQueryClient();

    return useMutation<any, Error, {email: string, password: string}>({
      mutationFn: ({ email, password })=> api.loginUser(backendUrl, email, password),
      onSuccess: (data) => {
        setToken(data.token)
        toast.success("Login Successful")
        navigate({ to: '/' })
      },
      onError:(error: Error)=> {
        console.error("Login error", error)
        toast.error(error.message || "Login Failed")
      }
    })
  }

//   register hook
export const useRegister = () => {
     const navigate = useNavigate()
    const { backendUrl } = useAppContext()

    return useMutation<any, Error, { name: string; email: string; password: string }>({
        mutationFn: ({ name, email, password })=> api.registerUser(backendUrl, name, email, password),
        onSuccess:() => {
            toast.success("Register Successfull! Please login")
            navigate({ to: '/login' })
        },
        onError: (error: Error) => {
            console.error('Registration error:', error);
            toast.error(error.message || 'Registration failed');
        },
    })
}

// get user profile
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



// update profile hook
export const updateUserProfile = () => {
  const { backendUrl, token } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation<UserData, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const { data } = await axios.put(
        `${backendUrl}/user/update-profile`, 
        formData,
        { 
          headers: { 
            token,
            'Content-Type': 'multipart/form-data' 
          } 
        }
      );
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.user; 
    },
    onSuccess: (updatedUser) => {
      // Update the cache with fresh user data
      queryClient.setQueryData(['userProfile', token], updatedUser);
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

// user book appointment hook
export const userBookAppointment = () => {
  const { backendUrl, token } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation<any, Error, { docId: string; slotDate: string; slotTime: string }>({
    mutationFn: async ({ docId, slotDate, slotTime }) => {
      const { data } = await axios.post(
        `${backendUrl}/user/book-appointment`,
        { docId, slotDate, slotTime },
        { headers: { token } }
      );
      if (!data.success) {
        throw new Error(data.message);
      }
      return data;
    },
    onSuccess: () => {
      // Invalidate appointments query to refetch
      queryClient.invalidateQueries({ queryKey: ['userAppointment'] });
      toast.success('Appointment booked successfully');
    },
    onError: (error: Error) => {
      console.error(error);
      toast.error(error.message || 'Failed to book appointment');
    },
  });
};

// get appointment
export const userGetAppointment = (): UseQueryResult<any, Error> => {
  const {backendUrl, token } = useAppContext()

  return useQuery<any, Error>({
    queryKey: ["userAppointment", token],
    queryFn:()=> api.getUserAppointment(backendUrl, token),
    enabled: !!token,
     staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}
// user cancel appointment hook
export const userCancelAppointment = () => {
  const { backendUrl, token } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation<any, Error, { appointmentId: string }>({
    mutationFn: async ({ appointmentId }) => {
      const { data } =  await axios.post(`${backendUrl}/user/cancel-appointment`, 
        {
        appointmentId
      }, 
      {
        headers: {
          token
        }
      })
      if(!data.success){
        throw new Error(data.message)
      }
      return data
    },
    onSuccess:() => {
      queryClient.invalidateQueries({ queryKey: ['userAppointment']})
      toast.success('Appointment cancelled successfully');
    },
    onError: (error: Error) => {
      console.error(error);
      toast.error(error.message || 'Failed to cancel appointment');
    },
  })
}