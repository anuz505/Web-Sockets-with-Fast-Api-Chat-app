// custom React Hook that manage the entire lifecycle of the websocket connection.
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "../types/auth-types";
import type {
  UseWebSocketReturn,
  Message,
  WebSocketMessage,
} from "../types/conversations-types";

export const useWebSocket = (token: string | null): UseWebSocketReturn => {
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

  const connect = useCallback(() => {
    // two checks
    if (!token) {
      setError("No token provided");
      return;
    }
    if (
      ws.current?.readyState === WebSocket.OPEN ||
      ws.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }
    // UI updates
    setConnectionStatus("connecting");
    setError(null);

    // ws connection
    const wsURL = "ws://localhost:8000/ws";
    ws.current = new WebSocket(wsURL);
    //ws connected
    ws.current.onopen = () => {
      setIsConnected(true);
      setConnectionStatus("connected");
    };
    // send the auth token first for validation
    ws.current?.send(JSON.stringify({ type: "auth", content: token }));

    // heartbeat
    pingIntervalRef.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 3000);

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
            setError(data.content || "Unkown Error");
            console.error("WS error", data.content);
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
            console.log("Pong");
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
            console.warn("Unkown message type bruh", data.type);
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
  }, [token]);
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
      connect();
    }
    return () => {
      disconnect;
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
