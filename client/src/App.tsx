import Home from "./components/Home.tsx";
import Login from "./components/Login.tsx";
import { Routes, Route } from "react-router";
import AuthLayout from "./components/AuthLayout.tsx";
import Register from "./components/Register.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import Conversation from "./components/Conversation.tsx";
import PeopleYouMayKnow from "./components/PeopleYouMayKnow.tsx";
import FriendRequests from "./components/FriendRequests.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import ShowUser from "./components/ShowUser.tsx";
import Notfound from "./components/common/Notfound.tsx";
import MyFriends from "./components/MyFriends.tsx";
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
          <Route element={<AppLayout />}>
            <Route path="chat" element={<Conversation />} />
            <Route path="friends" element={<MyFriends />} />
            <Route path="discover" element={<PeopleYouMayKnow />} />
            <Route path="friend-requests" element={<FriendRequests />} />
            <Route path="profile" element={<ShowUser />} />
          </Route>
        </Route>

        <Route path="*" element={<Notfound />} />
      </Routes>
    </>
  );
}

export default App;
