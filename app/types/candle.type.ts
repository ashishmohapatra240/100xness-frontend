export interface Candle {
    bucket: string;
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    time?: string;
}