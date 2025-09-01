import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderService } from "../services/order.service";
import toast from "react-hot-toast";

type OrderType = 'long' | 'short';

interface CreateOrderParams {
    quantity: number;
    price: number;
    orderType: OrderType;
    symbol: string;
    leverage?: number;
    stopLoss?: number | null;
    takeProfit?: number | null;
}

export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: CreateOrderParams) => orderService.createOrder(params),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] })
        }
    })
}

export const useGetOrders = () => {
    return useQuery({
        queryKey: ['orders'],
        queryFn: () => orderService.getOrders()
    })
}


export const useGetOrderById = (id: string) => {
    return useQuery({
        queryKey: ['order', id],
        queryFn: () => orderService.getOrderById(id)
    })
}

export const useCloseOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => orderService.closeOrder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Order closed successfully');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to close order');
        }
    })
}

export const useUpdateOrderTPSL = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, takeProfit, stopLoss }: { id: string, takeProfit: number, stopLoss: number }) => orderService.updateOrderTPSL(id, takeProfit, stopLoss),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] })
        },
        onError: () => {
            toast.error('Update order TPSL failed')
        },
        onSettled: () => {
            toast.success('Update order TPSL successful')
        }
    })
}