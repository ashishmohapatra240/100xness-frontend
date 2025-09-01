import { useEffect, useState } from "react"

export const useWs = () => {
    const [messages, setMessages] = useState<string[]>([]);
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");
        ws.onmessage = (event) => {
            setMessages((prev) => [event.data, ...prev])
        };

        return () => ws.close();
    }, []);

    return { messages };
}