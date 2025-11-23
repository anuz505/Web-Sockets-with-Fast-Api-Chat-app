import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice/index.ts";
import friendReducer from "./friends-slice/index.ts";
const store = configureStore({
  reducer: {
    auth: authReducer,
    friends: friendReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
