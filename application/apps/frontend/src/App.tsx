// App.tsx
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import SpaceView from "./components/SpaceView";
import type { User } from "./types/types";
import LandingPage from "./Landing";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") as "Admin" | "User" | null;

    if (token && role) {
      setUser({ token, role });
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem("token", userData.token);
    localStorage.setItem("role", userData.role);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage setUser={setUser} />} />
        <Route
          path="/login"
          element={
            !user ? (
              <Login setUser={handleLogin} />
            ) : (
              <Navigate to={user.role === "Admin" ? "/admin" : "/user"} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            !user ? (
              <Signup setUser={handleLogin} />
            ) : (
              <Navigate to={user.role === "Admin" ? "/admin" : "/user"} />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user ? (
              user.role === "Admin" ? (
                <AdminDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/user" />
              )
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/user"
          element={
            user ? (
              user.role === "User" ? (
                <UserDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/admin" />
              )
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="/space/:spaceId" element={<SpaceView user={user} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
