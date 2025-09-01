import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderService } from "../services/order.service";
import toast from "react-hot-toast";

type OrderType = 'long' | 'short';

export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ quantity, price, orderType, symbol }: { quantity: number, price: number, orderType: OrderType, symbol: string }) => orderService.createOrder(quantity, price, orderType, symbol),
        onSuccess: (data) => {
            queryClient.setQueryData(['orders'], data.orders);
            queryClient.invalidateQueries({ queryKey: ['orders'] })
        },
        onError: () => {
            toast.error('Create order failed')
        },
        onSettled: () => {
            toast.success('Create order successful')
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
            queryClient.invalidateQueries({ queryKey: ['orders'] })
        },
        onError: () => {
            toast.error('Close order failed')
        },
        onSettled: () => {
            toast.success('Close order successful')
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