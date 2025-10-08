import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import SpaceView from "./components/SpaceView";
import type { User } from "./types";
import LandingPage from "./Landing";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") as unknown as "Admin" | "User";
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
            user && user.role === "User" ? (
              <UserDashboard user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user && user.role === "Admin" ? (
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
