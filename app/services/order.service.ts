import axiosInstance from "../lib/axios";

type OrderType = 'long' | 'short';

export const orderService = {
    createOrder: async (quantity: number, price: number, orderType: OrderType, symbol: string) => {
        const response = await axiosInstance.post('/orders', { quantity, price, orderType, symbol })
        return response.data;
    },
    getOrders: async () => {
        const response = await axiosInstance.get('/orders')
        return response.data;
    },
    getOrderById: async (id: string) => {
        const response = await axiosInstance.get(`/orders/${id}`)
        return response.data;
    },
    closeOrder: async (id: string) => {
        const response = await axiosInstance.post(`/orders/${id}/close`)
        return response.data;
    },

    updateOrderTPSL: async (id: string, takeProfit: number, stopLoss: number) => {
        const response = await axiosInstance.post(`/orders/${id}/tpsl`, { takeProfit, stopLoss })
        return response.data;
    }
}
