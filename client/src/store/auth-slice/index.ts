import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { initialState } from "../../types/auth-types";
import type {
  User,
  RegisterFormData,
  LoginFormData,
  AuthResponse,
  ErrorResponse,
} from "../../types/auth-types";

export const RegisterUser = createAsyncThunk<
  User,
  RegisterFormData,
  { rejectValue: string }
>("/auth/register", async (formData, thunkAPI) => {
  try {
    const response = await axios.post(
      "http://127.0.0.1:8080/auth/register",
      formData,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail: string }>;
    return thunkAPI.rejectWithValue(
      axiosError.response?.data?.detail || "Registration failed"
    );
  }
});
export const loginUser = createAsyncThunk<
  { user: User; token: string },
  LoginFormData,
  { rejectValue: string }
>("auth/login", async (formData, thunkAPI) => {
  try {
    const params = new URLSearchParams();
    params.append("username", formData.username);
    params.append("password", formData.password);

    const loginResponse = await axios.post<AuthResponse>(
      "http://127.0.0.1:8080/auth/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const token = loginResponse.data?.access_token;
    const userResponse = await axios.get<User>(
      "http://127.0.0.1:8080/auth/me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    localStorage.setItem("access_token", token);
    return {
      user: userResponse.data,
      token: token,
    };
  } catch (error) {
    const axiosError = error as AxiosError<{ detail: string }>;
    return thunkAPI.rejectWithValue(
      axiosError.response?.data?.detail || "Login failed"
    );
  }
});

export const checkAuth = createAsyncThunk<User, void, { rejectValue: string }>(
  "auth/checkAuth",
  async (_, thunkAPI) => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return thunkAPI.rejectWithValue("No token found");
      }

      const response = await axios.get<User>(`http://127.0.0.1:8080/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem("access_token");
      const axiosError = error as AxiosError<ErrorResponse>;
      return thunkAPI.rejectWithValue(
        axiosError.response?.data?.detail || "Authentication failed"
      );
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("access_token");
});
//auth slice hai
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      (state.user = action.payload), (state.isAuthenticated = !!action.payload);
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    }, // Reset auth state
    resetAuth: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      state.isLoading = false;
      localStorage.removeItem("access_token");
    },
  },
  extraReducers: (builder) => {
    builder
      // Register User
      .addCase(RegisterUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(RegisterUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(RegisterUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Registration failed";
        state.isAuthenticated = false;
        state.user = null;
      })

      // Login User
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })

      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.token = localStorage.getItem("access_token");
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })

      // Logout User hai
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
        state.isLoading = false;
      });
  },
});

export const { setUser, clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
