"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { usePrice } from "../hooks/usePrice";
import { useCreateOrder, useGetOrders, useCloseOrder } from "../hooks/useOrder";

interface TradingSidebarProps {
    symbol: string;
    balance: number;
    className?: string;
}

const TradingSidebar: React.FC<TradingSidebarProps> = ({ symbol, balance, className = "" }) => {
    const { priceData, isConnected } = usePrice(symbol);
    const createOrderMutation = useCreateOrder();
    const { data: ordersData } = useGetOrders();
    const closeOrderMutation = useCloseOrder();
    
    const [orderForm, setOrderForm] = useState({
        quantity: "",
        leverage: "1",
        stopLoss: "",
        takeProfit: "",
        orderType: "long" as "long" | "short"
    });

    const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");

    const handleInputChange = (field: string, value: string) => {
        setOrderForm(prev => ({ ...prev, [field]: value }));
    };

    const calculateNotional = () => {
        const qty = Number(orderForm.quantity) || 0;
        const price = priceData?.last || 0;
        return qty * price;
    };

    const calculateMargin = () => {
        const notional = calculateNotional();
        const leverage = Number(orderForm.leverage) || 1;
        return notional / leverage;
    };

    const getValidationError = () => {
        const margin = calculateMargin();
        const quantity = Number(orderForm.quantity);
        const leverage = Number(orderForm.leverage);
        const stopLoss = orderForm.stopLoss ? Number(orderForm.stopLoss) : null;
        const takeProfit = orderForm.takeProfit ? Number(orderForm.takeProfit) : null;
        
        if (quantity <= 0) return "Enter a valid quantity";
        if (!priceData?.last) return "Price data not available";
        if (margin > balance) return `Insufficient balance. Required: $${margin.toFixed(2)}`;
        if (leverage < 1 || leverage > 100) return "Leverage must be between 1x and 100x";
        
        // Validate TP/SL for long positions
        if (activeTab === "buy") {
            if (takeProfit && takeProfit <= priceData.ask) {
                return "Take profit must be above ask price for long positions";
            }
            if (stopLoss && stopLoss >= priceData.ask) {
                return "Stop loss must be below ask price for long positions";
            }
        }
        
        // Validate TP/SL for short positions
        if (activeTab === "sell") {
            if (takeProfit && takeProfit >= priceData.bid) {
                return "Take profit must be below bid price for short positions";
            }
            if (stopLoss && stopLoss <= priceData.bid) {
                return "Stop loss must be above bid price for short positions";
            }
        }
        
        return null;
    };

    const canPlaceOrder = () => {
        return !getValidationError() && !createOrderMutation.isPending;
    };

    const handlePlaceOrder = async () => {
        if (!canPlaceOrder() || !priceData) return;

        const orderType = activeTab === "buy" ? "long" : "short";
        const price = activeTab === "buy" ? priceData.ask : priceData.bid;

        try {
            await createOrderMutation.mutateAsync({
                quantity: Number(orderForm.quantity),
                price: price,
                orderType: orderType,
                symbol: symbol.toLowerCase(),
                leverage: Number(orderForm.leverage),
                stopLoss: orderForm.stopLoss ? Number(orderForm.stopLoss) : null,
                takeProfit: orderForm.takeProfit ? Number(orderForm.takeProfit) : null,
            });

            // Reset form on success
            setOrderForm({
                quantity: "",
                leverage: "1",
                stopLoss: "",
                takeProfit: "",
                orderType: "long"
            });
            
            toast.success(`${activeTab === "buy" ? "Buy" : "Sell"} order placed successfully!`);
        } catch (error: any) {
            console.error("Order creation failed:", error);
            toast.error(error?.response?.data?.message || "Failed to place order");
        }
    };

    return (
        <div className={`w-full lg:w-80 bg-white lg:border-l border-gray-200 flex flex-col h-full ${className}`}>
            {/* Price Display */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-black font-ibm-plex-mono">
                        {symbol.toUpperCase()}
                    </h2>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                
                {priceData ? (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Last Price</span>
                            <span className="text-lg font-semibold text-black font-ibm-plex-mono">
                                ${priceData.last.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Bid</span>
                            <span className="text-sm font-medium text-red-600 font-ibm-plex-mono">
                                ${priceData.bid.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Ask</span>
                            <span className="text-sm font-medium text-green-600 font-ibm-plex-mono">
                                ${priceData.ask.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">24h Change</span>
                            <span className={`text-sm font-medium font-ibm-plex-mono ${priceData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {priceData.changePercent >= 0 ? '+' : ''}{priceData.changePercent.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <div className="text-gray-500">Loading price data...</div>
                    </div>
                )}
            </div>

            {/* Balance Display */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Available Balance</span>
                    <span className="text-lg font-semibold text-black font-ibm-plex-mono">
                        ${balance.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Order Form */}
            <div className="flex-1 p-4">
                {/* Buy/Sell Tabs */}
                <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                    <button
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            activeTab === "buy"
                                ? "bg-green-600 text-white"
                                : "text-gray-600 hover:text-black"
                        }`}
                        onClick={() => setActiveTab("buy")}
                    >
                        Buy / Long
                    </button>
                    <button
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            activeTab === "sell"
                                ? "bg-red-600 text-white"
                                : "text-gray-600 hover:text-black"
                        }`}
                        onClick={() => setActiveTab("sell")}
                    >
                        Sell / Short
                    </button>
                </div>

                {/* Order Form Inputs */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                        </label>
                        <input
                            type="number"
                            placeholder="0.00"
                            step="0.0001"
                            min="0"
                            value={orderForm.quantity}
                            onChange={(e) => handleInputChange("quantity", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && canPlaceOrder()) {
                                    handlePlaceOrder();
                                }
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Leverage
                        </label>
                        <select
                            value={orderForm.leverage}
                            onChange={(e) => handleInputChange("leverage", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="1">1x</option>
                            <option value="2">2x</option>
                            <option value="5">5x</option>
                            <option value="10">10x</option>
                            <option value="20">20x</option>
                            <option value="50">50x</option>
                            <option value="100">100x</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Take Profit (Optional)
                        </label>
                        <input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={orderForm.takeProfit}
                            onChange={(e) => handleInputChange("takeProfit", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stop Loss (Optional)
                        </label>
                        <input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={orderForm.stopLoss}
                            onChange={(e) => handleInputChange("stopLoss", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Order Summary */}
                    {Number(orderForm.quantity) > 0 && priceData && (
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Entry Price</span>
                                <span className="font-medium">
                                    ${(activeTab === "buy" ? priceData.ask : priceData.bid).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Notional</span>
                                <span className="font-medium">${calculateNotional().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Required Margin</span>
                                <span className="font-medium">${calculateMargin().toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Place Order Button */}
                    <button
                        onClick={handlePlaceOrder}
                        disabled={!canPlaceOrder()}
                        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                            activeTab === "buy"
                                ? "bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                                : "bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
                        } disabled:cursor-not-allowed`}
                    >
                        {createOrderMutation.isPending
                            ? "Placing Order..."
                            : `${activeTab === "buy" ? "Buy" : "Sell"} ${symbol.toUpperCase()}`
                        }
                    </button>

                    {/* Validation Messages */}
                    {getValidationError() && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                            {getValidationError()}
                        </div>
                    )}
                </div>

                {/* Open Orders Section */}
                {ordersData?.orders && ordersData.orders.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Open Orders</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {ordersData.orders
                                .filter((order: any) => order.status === "open" && order.symbol === symbol.toLowerCase())
                                .map((order: any) => (
                                <div key={order.id} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                order.orderType === "long" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            }`}>
                                                {order.orderType.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-600">{order.leverage}x</span>
                                        </div>
                                        <button
                                            onClick={() => closeOrderMutation.mutate(order.id)}
                                            disabled={closeOrderMutation.isPending}
                                            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <div className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Qty:</span>
                                            <span>{Number(order.quantity).toFixed(4)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Entry:</span>
                                            <span>${Number(order.price).toFixed(2)}</span>
                                        </div>
                                        {order.takeProfit && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">TP:</span>
                                                <span className="text-green-600">${Number(order.takeProfit).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {order.stopLoss && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">SL:</span>
                                                <span className="text-red-600">${Number(order.stopLoss).toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TradingSidebar;