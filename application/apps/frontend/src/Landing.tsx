import { useNavigate } from "react-router-dom";
import { memo } from "react";
import type { User } from "./types/types";

const LandingPage: React.FC<{ setUser: (user: User | null) => void }> = memo(
  () => {
    const navigate = useNavigate();

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-10 tracking-tight animate-fade-in-down">
          Welcome to Virtual Space
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-12 text-center max-w-2xl animate-fade-in">
          Explore a dynamic virtual arena, connect with others, and unleash your
          creativity in an immersive digital experience.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 text-lg font-semibold"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="bg-green-600 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-300 text-lg font-semibold"
          >
            Sign Up
          </button>
          <button
            onClick={() => navigate("/space/demo")}
            className="bg-purple-600 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-purple-700 transform hover:scale-105 transition-all duration-300 text-lg font-semibold"
          >
            Join Demo Arena
          </button>
        </div>
      </div>
    );
  }
);

export default LandingPage;
