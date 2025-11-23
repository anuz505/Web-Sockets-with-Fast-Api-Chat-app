import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import type { FriendsProfile } from "../../types/friends-types";
import { initialState } from "../../types/friends-types";

export const AllFriends = createAsyncThunk<FriendsProfile[], void>(
  "/friends/getAllFriends",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(
        "http://localhost:8000/friends/allfriends",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || "Failed to fetch Friends"
      );
    }
  }
);
export const fetchPeopleYouMayKnow = createAsyncThunk<FriendsProfile[], void>(
  "/friends/peopleyoumayknow",
  async (_, thunkAPI) => {
    try {
      const res = await axios.get(
        "http://localhost:8000/friends/peopleyoumayknow",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      return res.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || "failed to fetch People you may know"
      );
    }
  }
);
export const fetchFriendRequests = createAsyncThunk<FriendsProfile[], void>(
  "/friends/friendrequests",
  async (_, thunkAPI) => {
    try {
      const res = await axios.get(
        "http://localhost:8000/friends/friendrequests",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      return res.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || "failed to fetch Friend Requests"
      );
    }
  }
);
const friendslice = createSlice({
  name: "friends",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(AllFriends.pending, (state) => {
      (state.loading = true), (state.error = null);
    });
    builder.addCase(AllFriends.fulfilled, (state, action) => {
      (state.friends = action.payload),
        (state.loading = false),
        (state.error = null);
    });
    builder.addCase(AllFriends.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    builder.addCase(fetchPeopleYouMayKnow.pending, (state) => {
      (state.loading = true), (state.error = null);
    });
    builder.addCase(fetchPeopleYouMayKnow.fulfilled, (state, action) => {
      (state.loading = false),
        (state.peopleYouMayKnow = action.payload),
        (state.error = null);
    });
    builder.addCase(fetchPeopleYouMayKnow.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    builder.addCase(fetchFriendRequests.pending, (state) => {
      (state.loading = true), (state.error = null);
    });
    builder.addCase(fetchFriendRequests.fulfilled, (state, action) => {
      (state.loading = false),
        (state.friendRequests = action.payload),
        (state.error = null);
    });
    builder.addCase(fetchFriendRequests.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});
export default friendslice.reducer;
