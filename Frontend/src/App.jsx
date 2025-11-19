import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import EditPost from "./pages/EditPost";
import UploadProfilePic from "./pages/UploadProfilePic";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/edit/:id" element={<EditPost />} />
      <Route path="/upload" element={<UploadProfilePic />} />
    </Routes>
  );
}
