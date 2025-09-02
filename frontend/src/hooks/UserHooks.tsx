import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { useNavigate } from "@tanstack/react-router";
import axios from "axios";

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

// update profile hook

export const useUpdateUserProfile = () => {
  const { backendUrl, token } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation<UserData, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const { data } = await axios.post(
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