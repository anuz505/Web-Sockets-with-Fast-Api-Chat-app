import axios, { AxiosError } from "axios";
import type { FriendsProfile } from "../types/friends-types";
interface ApiError {
  message?: string;
  detail?: string;
}
export function getFriends() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }
    return axios
      .get<FriendsProfile[]>("http://localhost:8000/friends/allfriends", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => res.data);
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
