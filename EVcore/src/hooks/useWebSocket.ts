import { useState, useEffect, useRef, useCallback } from 'react';
import { config } from '../config/environment';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: number;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectOnClose?: boolean;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Event | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectOnClose = true,
    maxReconnectAttempts = config.WS_MAX_RECONNECT_ATTEMPTS,
  } = options;
  
  const connect = useCallback(() => {
    if (!config.ENABLE_REAL_TIME) {
      console.log('WebSocket disabled by configuration');
      return;
    }
    
    try {
      const token = localStorage.getItem(config.TOKEN_STORAGE_KEY);
      const wsUrl = `${config.WS_URL}${token ? `?token=${token}` : ''}`;
      
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        onConnect?.();
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        onDisconnect?.();
        
        if (reconnectOnClose && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, config.WS_RECONNECT_INTERVAL);
        }
      };
      
      ws.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(event);
        onError?.(event);
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
    }
  }, [onMessage, onConnect, onDisconnect, onError, reconnectOnClose, maxReconnectAttempts]);
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);
  
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        ...message,
        timestamp: Date.now(),
      }));
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  }, []);
  
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Reconnect when auth token changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === config.TOKEN_STORAGE_KEY) {
        disconnect();
        setTimeout(connect, 1000); // Delay to ensure token is set
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [connect, disconnect]);
  
  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect,
  };
};

export default useWebSocket;
