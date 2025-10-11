import Home from "./components/Home.tsx";
import Login from "./components/Login.tsx";
import { Routes, Route } from "react-router";
import AuthLayout from "./components/AuthLayout.tsx";
import Register from "./components/Register.tsx";
function App() {
  return (
    <>
      <Routes>
        <Route index element={<Home />} />
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
