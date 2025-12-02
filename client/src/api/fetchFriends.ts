import axios, { AxiosError } from "axios";
import type { FriendsProfile } from "../types/friends-types";
export interface ApiError {
  message?: string;
  detail?: string;
}
export async function getFriends() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }
    const response = await axios.get<FriendsProfile[]>(
      "http://localhost:8080/friends/allfriends",
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

export async function getPeopleYouMayKnow() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }
    const response = await axios.get<FriendsProfile[]>(
      "http://localhost:8080/friends/peopleyoumayknow",
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

export async function getFriendRequests() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }
    const response = await axios.get<FriendsProfile[]>(
      "http://localhost:8080/friends/friendrequests",
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
