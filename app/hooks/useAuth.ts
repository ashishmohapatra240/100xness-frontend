import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";


export const useAuth = () => {
    const queryClient = useQueryClient();
    const router = useRouter();


    const loginMutation = useMutation({
        mutationFn: ({ email, password }: { email: string, password: string }) => authService.login(email, password),
        onSuccess: (data) => {
            queryClient.setQueryData(['user'], data.user);
            queryClient.invalidateQueries({ queryKey: ['auth'] })
            toast.success('Login successful!');
        },
        onError: () => {
            toast.error('Login failed')
        },
        onSettled: () => {
            toast.success('Login successful')
        }
    });

    const registerMutation = useMutation({
        mutationFn: ({ name, email, password }: { name: string, email: string, password: string }) => authService.register(name, email, password),
        onSuccess: (data) => {
            queryClient.setQueryData(['user'], data.user);
            toast.success('Registration successful!');
            router.push('/');
        },
        onError: () => {
            toast.error('Registration failed')
        },
        onSettled: () => {
            toast.success('Registration successful')
        }
    });


    return { loginMutation, registerMutation }

}
