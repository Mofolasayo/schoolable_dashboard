'use client';

import { useEffect, useState, ReactNode } from 'react';
import { WebSocketProvider } from './websocket';

// This component fetches the auth token and provides it to WebSocketProvider
export function WebSocketWrapper({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Fetch token from our API route
        async function fetchToken() {
            try {
                const res = await fetch('/api/auth/token');
                if (res.ok) {
                    const data = await res.json();
                    setToken(data.token || null);
                }
            } catch (e) {
                console.error('Failed to fetch auth token:', e);
            }
        }

        fetchToken();
    }, []);

    return (
        <WebSocketProvider token={token}>
            {children}
        </WebSocketProvider>
    );
}
