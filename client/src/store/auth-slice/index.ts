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
    const response = await axios.post("/auth/register", formData, {
      withCredentials: true,
    });
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
      "/auth/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        withCredentials: true,
      }
    );
    const token = loginResponse.data?.access_token;
    const userResponse = await axios.get<User>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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

export const refreshAccessToken = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>("auth/refresh", async (_, thunkAPI) => {
  try {
    const response = await axios.post<AuthResponse>(
      "/auth/refresh",
      {},
      {
        withCredentials: true,
      }
    );
    return response.data.access_token;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail: string }>;
    return thunkAPI.rejectWithValue(
      axiosError.response?.data?.detail || "Token refresh failed"
    );
  }
});

export const checkAuth = createAsyncThunk<User, void, { rejectValue: string }>(
  "auth/checkAuth",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as { auth: typeof initialState };
      let token = state.auth.token;

      if (!token) {
        const refreshResult = await thunkAPI.dispatch(refreshAccessToken());
        if (refreshAccessToken.fulfilled.match(refreshResult)) {
          token = refreshResult.payload;
        } else {
          return thunkAPI.rejectWithValue("No valid token found");
        }
      }

      const response = await axios.get<User>(`/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      // Token is invalid or expired
      const axiosError = error as AxiosError<ErrorResponse>;
      return thunkAPI.rejectWithValue(
        axiosError.response?.data?.detail || "Authentication failed"
      );
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await axios.post(
    "/auth/logout",
    {},
    {
      withCredentials: true,
    }
  );
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

      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        (state.token = action.payload), (state.isAuthenticated = true);
      })
      .addCase(refreshAccessToken.rejected, (state) => {
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
