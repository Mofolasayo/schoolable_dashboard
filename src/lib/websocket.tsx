'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';

type MessageHandler = (data: Record<string, unknown>) => void;

interface WebSocketContextType {
    isConnected: boolean;
    subscribe: (topic: string, handler: MessageHandler) => () => void;
    sendMessage: (type: string, data: Record<string, unknown>) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

function getWsUrl(): string {
    return API_URL
        .replace('https://', 'wss://')
        .replace('http://', 'ws://');
}

export function WebSocketProvider({
    children,
    token
}: {
    children: ReactNode;
    token: string | null;
}) {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const subscribersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = useCallback(() => {
        if (!token || wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const wsUrl = `${getWsUrl()}/ws-native`;
            console.log('🔌 Connecting to WebSocket:', wsUrl);

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;

                // Send authentication message
                ws.send(JSON.stringify({
                    type: 'AUTH',
                    token: token,
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const messageType = data.type as string;

                    console.log('📥 WebSocket message:', messageType);

                    // Handle auth responses
                    if (messageType === 'AUTH_SUCCESS') {
                        console.log('✅ WebSocket authenticated');
                        return;
                    }
                    if (messageType === 'AUTH_FAILED') {
                        console.log('❌ WebSocket auth failed');
                        ws.close();
                        return;
                    }
                    if (messageType === 'PONG') {
                        return;
                    }

                    // Notify subscribers based on message type
                    const topic = messageType.toLowerCase();
                    const handlers = subscribersRef.current.get(topic);
                    handlers?.forEach((handler) => handler(data));

                    // Also notify wildcard subscribers
                    const wildcardHandlers = subscribersRef.current.get('*');
                    wildcardHandlers?.forEach((handler) => handler(data));
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                setIsConnected(false);
                wsRef.current = null;

                // Attempt reconnect
                if (token && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

                    reconnectTimeoutRef.current = setTimeout(connect, delay);
                }
            };
        } catch (e) {
            console.error('Failed to create WebSocket:', e);
        }
    }, [token]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
    }, []);

    // Connect when token is available
    useEffect(() => {
        if (token) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [token, connect, disconnect]);

    // Heartbeat to keep connection alive
    useEffect(() => {
        if (!isConnected) return;

        const interval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'PING' }));
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [isConnected]);

    const subscribe = useCallback((topic: string, handler: MessageHandler) => {
        if (!subscribersRef.current.has(topic)) {
            subscribersRef.current.set(topic, new Set());
        }
        subscribersRef.current.get(topic)!.add(handler);

        // Return unsubscribe function
        return () => {
            subscribersRef.current.get(topic)?.delete(handler);
            if (subscribersRef.current.get(topic)?.size === 0) {
                subscribersRef.current.delete(topic);
            }
        };
    }, []);

    const sendMessage = useCallback((type: string, data: Record<string, unknown>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, ...data }));
        } else {
            console.warn('⚠️ Cannot send message: WebSocket not connected');
        }
    }, []);

    return (
        <WebSocketContext.Provider value={{ isConnected, subscribe, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}

// Hook to subscribe to specific message types
export function useWebSocketSubscription(
    topic: string,
    handler: MessageHandler,
    deps: React.DependencyList = []
) {
    const { subscribe } = useWebSocket();

    useEffect(() => {
        const unsubscribe = subscribe(topic, handler);
        return unsubscribe;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topic, subscribe, ...deps]);
}
