import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";
import store from "./store/store.ts";
import { checkAuth } from "./store/auth-slice/index.ts";
store.dispatch(checkAuth());
const queryClient = new QueryClient();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </QueryClientProvider>
  </StrictMode>
);
