import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import SpaceView from "./components/SpaceView";
import type { User } from "./types";

const LandingPage: React.FC<{ setUser: (user: User | null) => void }> = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to Virtual Space</h1>
      <div className="flex space-x-4">
        <button
          onClick={() => navigate("/login")}
          className="bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
        >
          Login
        </button>
        <button
          onClick={() => navigate("/signup")}
          className="bg-green-500 text-white p-3 rounded hover:bg-green-600"
        >
          Sign Up
        </button>
        <button
          onClick={() => navigate("/space/demo_space_id")}
          className="bg-purple-500 text-white p-3 rounded hover:bg-purple-600"
        >
          Join Demo Arena
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") as unknown as "admin" | "user";
    if (token && role) {
      setUser({ token, role });
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<Signup setUser={setUser} />} />
        <Route
          path="/user"
          element={
            user && user.role === "user" ? (
              <UserDashboard user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user && user.role === "admin" ? (
              <AdminDashboard user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/space/:spaceId"
          element={<SpaceView user={user as unknown as User} />}
        />
        <Route path="/" element={<LandingPage setUser={setUser} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
