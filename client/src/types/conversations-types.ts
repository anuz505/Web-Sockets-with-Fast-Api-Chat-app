import type { User } from "./auth-types";

export interface ConversationType {
  other_user_id: number;
  username: string;
  last_message: string;
  last_message_time: Date;
}
export type Conversations = ConversationType[];

export interface WebSocketMessage {
  type: "auth_success" | "error" | "pong" | "new_message" | "message_sent";
  content?: string;
  user?: User;
  delivered?: boolean;
  id?: number;
  sender_id: number;
  reciever_id: number;
  created_at: Date;
  is_read: boolean;
}
export interface Message {
  id: number;
  sender_id: number;
  reciever_id: number;
  content: string;
  created_at: Date;
  is_read: boolean;
}
export interface UseWebSocketReturn {
  isConnected: boolean;
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
  sendMessage: (recieverId: number, content: string) => void;
  message: Message[];
  connectionStatus:
    | "disconnected"
    | "connecting"
    | "connected"
    | "authenticated";
}
