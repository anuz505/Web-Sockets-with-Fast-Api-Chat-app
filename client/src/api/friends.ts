import axios, { AxiosError } from "axios";
import type { ApiError } from "./fetchFriends";
import store from "../store/store";

export async function sendFriendRequest(friendId: number) {
  try {
    const token = store.getState().auth.token;
    if (!token) {
      throw new Error("Authentication required. Please log in");
    }
    const response = await axios.post(
      "/friends/send_friend_request",
      { id: friendId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.detail ||
          "Failed to send Friend Request. Please try again."
      );
    }
  }
}
export async function acceptFriendRequest(friendId: number) {
  try {
    const token = store.getState().auth.token;
    if (!token) {
      throw new Error("Authentication required. Please log in");
    }
    await axios.patch(
      `/friends/accept/${friendId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.detail ||
          "Failed to accept Friend Request Please try again."
      );
    }
  }
}

export async function rejectFriendRequest(friendId: number) {
  try {
    const token = store.getState().auth.token;
    if (!token) {
      throw new Error("Authentication required. Please log in");
    }
    await axios.patch(
      `/friends/reject/${friendId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.detail ||
          "Failed to accept Friend Request Please try again."
      );
    }
  }
}
