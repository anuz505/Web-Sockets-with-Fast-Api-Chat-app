export interface ConversationType {
  other_user_id: number;
  username: string;
  last_message: string;
  last_message_time: Date;
}
export type Conversations = ConversationType[];
