import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../api";
import type { User } from "../types/types";

interface SignupProps {
  setUser: (user: User) => void;
}

const Signup: React.FC<SignupProps> = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"User" | "Admin">("User");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault(); // Prevent default form submission
    }

    const response = await signup(username, password, role);
    console.log(response);
    if (response.status === 200) {
      const { userId } = response.data;
      localStorage.setItem("userId", userId);
      navigate("/login");
    } else {
      setError("Signup failed");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    handleSignup(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "User" | "Admin")}
            className="w-full p-2 border rounded"
          >
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Sign Up
        </button>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500">
            Login
          </a>
        </p>
      </form>
    </div>
  );
};

export default Signup;
