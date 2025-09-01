import publicAxios from "../lib/axios";

export const candlesService = {
    getCandles: async (timeframe: string, startTime: number, endTime: number, asset: string) => {
        const response = await publicAxios.get(`/candles?ts=${timeframe}&startTime=${startTime}&endTime=${endTime}&asset=${asset}`)
        return response.data.data;
    },
    getSymbols: async () => {
        const response = await publicAxios.get('/candles/symbols')
        return response.data.data;
    }
}
