import axiosInstance, { publicAxios } from '../lib/axios';

export const authService = {
    login: async (email: string, password: string) => {
        const response = await publicAxios.post('/auth/login', { email, password })
        return response.data;
    },

    register: async (name: string, email: string, password: string) => {
        const response = await publicAxios.post('/auth/register', { name, email, password })
        return response.data;
    },

    logout: async () => {
        const response = await axiosInstance.post('/auth/logout')
        return response.data;
    }
} 