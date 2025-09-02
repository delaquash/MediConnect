import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { useNavigate } from "@tanstack/react-router";
    // console.log(VITE_BACKEND_URL)
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

export const updateUserProfileHook =() => {
  const {backendUrl, token } = useAppContext()
}