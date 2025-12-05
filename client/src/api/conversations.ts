import axios, { AxiosError } from "axios";
import type { Message, Conversations } from "../types/conversations-types";
import store from "../store/store";
export interface ApiError {
  message?: string;
  detail?: string;
}
export async function getAllConversations() {
  try {
    const token = store.getState().auth.token;
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }
    const response = await axios.get<Conversations>(
      "/messages/conversations?limit=50&offset=0",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.detail ||
          "Failed to fetch conversations. Please try again."
      );
    }
  }
}
export async function retrieverChatHistory(other_user_id: number) {
  try {
    const token = store.getState().auth.token;
    if (!token) {
      throw new Error("Authentication required. Please log in");
    }
    const response = await axios.get<Message[]>(
      `/messages/conversations/${other_user_id}?limit=50&offset=0`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.detail ||
          "Failed to fetch conversations. Please try again."
      );
    }
  }
}
