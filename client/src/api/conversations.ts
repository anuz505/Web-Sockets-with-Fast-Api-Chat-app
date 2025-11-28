import axios, { AxiosError } from "axios";
import type { Conversations } from "../types/conversations-types";
export interface ApiError {
  message?: string;
  detail?: string;
}
export async function getAllConversations() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }
    const response = await axios.get<Conversations>(
      "http://localhost:8000/messages/conversations?limit=50&offset=0",
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
          "Failed to fetch friends. Please try again."
      );
    }
  }
}
