import Home from "./components/Home.tsx";
import Login from "./components/Login.tsx";
import { Routes, Route } from "react-router";
import AuthLayout from "./components/AuthLayout.tsx";
import Register from "./components/Register.tsx";
import { Navigate } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import Chat from "./components/Chat.tsx";
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="chat" element={<Chat />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
