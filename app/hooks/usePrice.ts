import { useEffect, useState } from "react";
import { useGetCandles } from "./useCandles";

interface PriceData {
    symbol: string;
    bid: number;
    ask: number;
    last: number;
    change: number;
    changePercent: number;
}

export const usePrice = (symbol: string) => {
    const [priceData, setPriceData] = useState<PriceData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // Fallback to candle data if WebSocket is not available
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (24 * 60 * 60); // Last 24 hours for change calculation
    const { data: candleData } = useGetCandles("1h", startTime, endTime, symbol);

    useEffect(() => {
        if (!symbol) return;

        const ws = new WebSocket("ws://localhost:8080");
        
        ws.onopen = () => {
            setIsConnected(true);
            // Subscribe to price updates for the symbol
            ws.send(JSON.stringify({ type: 'subscribe', symbol: symbol.toLowerCase() }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'price' && data.symbol === symbol.toLowerCase()) {
                    setPriceData({
                        symbol: data.symbol,
                        bid: Number(data.bid),
                        ask: Number(data.ask),
                        last: Number(data.last || data.bid), // fallback to bid if last not available
                        change: Number(data.change || 0),
                        changePercent: Number(data.changePercent || 0)
                    });
                }
            } catch (error) {
                console.error('Error parsing price data:', error);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [symbol]);

    // Fallback to candle data if WebSocket is not connected
    useEffect(() => {
        if (!isConnected && candleData && candleData.length > 0) {
            const latestCandle = candleData[candleData.length - 1];
            const firstCandle = candleData[0];
            
            if (latestCandle && firstCandle) {
                const currentPrice = Number(latestCandle.close);
                const previousPrice = Number(firstCandle.open);
                const change = currentPrice - previousPrice;
                const changePercent = (change / previousPrice) * 100;
                
                // Create mock bid/ask spread (typically 0.1% for crypto)
                const spread = currentPrice * 0.001;
                
                setPriceData({
                    symbol: symbol.toLowerCase(),
                    bid: currentPrice - spread / 2,
                    ask: currentPrice + spread / 2,
                    last: currentPrice,
                    change: change,
                    changePercent: changePercent
                });
            }
        }
    }, [isConnected, candleData, symbol]);

    return { priceData, isConnected };
};