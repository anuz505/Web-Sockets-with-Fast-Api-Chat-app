// custom React Hook that manage the entire lifecycle of the websocket connection.
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks/hook";
import { refreshAccessToken } from "../store/auth-slice";
import type { User } from "../types/auth-types";
import type {
  UseWebSocketReturn,
  Message,
  WebSocketMessage,
} from "../types/conversations-types";

export const useWebSocket = (): UseWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>("");
  const [message, setMessage] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "authenticated"
  >("disconnected");
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  // Get token from Redux state
  const { token } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const connect = useCallback(async () => {
    // two checks
    if (!token) {
      console.log("WebSocket: Waiting for token...");
      return;
    }
    if (
      ws.current?.readyState === WebSocket.OPEN ||
      ws.current?.readyState === WebSocket.CONNECTING
    ) {
      console.log("WebSocket: Already connecting or connected");
      return;
    }
    // UI updates
    setConnectionStatus("connecting");
    setError(null);

    // ws connection - use same origin as frontend
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsURL = `${protocol}//${window.location.host}/ws`;
    console.log("WebSocket: Connecting to", wsURL);

    try {
      ws.current = new WebSocket(wsURL);
    } catch (error) {
      console.error("WebSocket: Failed to create connection", error);
      setError("Failed to create WebSocket connection");
      setConnectionStatus("disconnected");
      return;
    }

    //ws connected
    ws.current.onopen = () => {
      console.log("WebSocket: Connection opened");
      setIsConnected(true);
      setConnectionStatus("connected");
      ws.current?.send(JSON.stringify({ type: "auth", content: token }));
    };
    // send the auth token first for validation

    // heartbeat
    pingIntervalRef.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    // switchboard hai
    ws.current.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);

        switch (data.type) {
          case "auth_success":
            setIsAuthenticated(true);
            setConnectionStatus("authenticated");
            setUser(data.user || null);
            console.log(data.user, "authenticated");
            break;
          case "error":
            setError(data.content || "Unknown Error");
            console.error("WS error", data.content);

            // If token expired, try to refresh
            if (
              data.content?.includes("Token expired") ||
              data.content?.includes("expired")
            ) {
              dispatch(refreshAccessToken()).then(() => {
                // Reconnect with new token
                disconnect();
                setTimeout(connect, 1000);
              });
            }
            break;
          case "message_sent":
            const sentMessage: Message = {
              id: data.id!,
              sender_id: data.sender_id!,
              reciever_id: data.reciever_id!,
              content: data.content!,
              created_at: data.created_at!,
              is_read: data.is_read!,
            };
            setMessage((prev) => [...prev, sentMessage]);
            break;
          case "pong":
            console.log("Pong received");
            break;

          case "new_message":
            // recieved msg
            const new_message: Message = {
              id: data.id!,
              sender_id: data.sender_id!,
              reciever_id: data.reciever_id!,
              content: data.content!,
              created_at: data.created_at!,
              is_read: data.is_read!,
            };
            setMessage((prev) => [...prev, new_message]);
            break;
          default:
            console.warn("Unknown message type", data.type);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };
    ws.current.onerror = (event) => {
      console.error("WebSocket error:", event);
      setError("WebSocket connection error");
    };
    ws.current.onclose = (event) => {
      // Ui updates
      setIsConnected(false);
      setIsAuthenticated(false);
      setConnectionStatus("disconnected");

      // ping interval cleanup cause why ping a dead websocket
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      // Reconnection try for every 5 seconds
      if (token && event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      }
    };
  }, [token, dispatch]);
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, "Client disconnect");
      ws.current = null;
    }

    setIsConnected(false);
    setIsAuthenticated(false);
    setConnectionStatus("disconnected");
  }, []);

  const sendMessage = useCallback(
    (receiverId: number, content: string) => {
      if (
        !isAuthenticated ||
        !ws.current ||
        ws.current.readyState !== WebSocket.OPEN
      ) {
        setError("WebSocket is not connected or authenticated");
        return;
      }

      ws.current.send(
        JSON.stringify({
          type: "message",
          reciever_id: receiverId,
          content: content,
        })
      );
    },
    [isAuthenticated]
  );
  useEffect(() => {
    if (token) {
      // Add small delay to ensure backend is ready after login
      const timeoutId = setTimeout(() => {
        console.log("WebSocket: Token available, attempting connection");
        connect();
      }, 500);

      return () => {
        clearTimeout(timeoutId);
        disconnect();
      };
    }
    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);
  return {
    isConnected,
    isAuthenticated,
    user,
    error,
    sendMessage,
    message,
    connectionStatus,
  };
};
