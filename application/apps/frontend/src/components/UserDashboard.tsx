import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createSpace, getSpaces, getAvatars, updateAvatar } from "../api";
import type { User, Space, Avatar } from "../types";
import { ImagePreview } from "./ImagePreview";

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLogout }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [name, setName] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [mapId, setMapId] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [activeSection, setActiveSection] = useState("Select Avatar");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const spacesResponse = await getSpaces(user.token);
      if (spacesResponse.status === 200) {
        setSpaces(spacesResponse.data.spaces);
      }
      const avatarsResponse = await getAvatars();
      if (avatarsResponse.status === 200) {
        setAvatars(avatarsResponse.data.avatars);
      }
    };
    fetchData();
  }, [user.token]);

  const handleCreateSpace = async () => {
    const response = await createSpace(
      name,
      dimensions,
      mapId || undefined,
      user.token
    );
    if (response.status === 200) {
      setSpaces([...spaces, response.data]);
      setName("");
      setDimensions("");
      setMapId("");
    }
  };

  const handleAvatarUpdate = async () => {
    const response = await updateAvatar(selectedAvatar, user.token);
    if (response.status === 200) {
      alert("Avatar updated successfully");
    }
  };

  const sections = ["Create Space", "Select Avatar", "Your Spaces"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Vertical Navbar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">User Dashboard</h1>
        </div>
        <nav className="flex-1">
          {sections.map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`w-full text-left py-3 px-6 text-lg transition-colors duration-200 ${
                activeSection === section
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              {section}
            </button>
          ))}
        </nav>
        <button
          onClick={() => {
            onLogout(); // Call the parent's logout function
            navigate("/");
          }}
          className="m-6 bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition-all duration-300"
        >
          Logout
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8 animate-fade-in">
          {activeSection === "Create Space" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Create Space
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Space Name
                </label>
                <input
                  type="text"
                  placeholder="Space Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions (e.g., 100x200)
                </label>
                <input
                  type="text"
                  placeholder="Dimensions (e.g., 100x200)"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Map Image URL (optional)
                </label>
                <div className="flex items-end space-x-4">
                  <input
                    type="text"
                    placeholder="Enter map image URL (optional)"
                    value={mapId}
                    onChange={(e) => setMapId(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ImagePreview
                    imageUrl={mapId}
                    altText="Map Preview"
                    size="w-40 h-40"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateSpace}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300"
              >
                Create Space
              </button>
            </div>
          )}

          {activeSection === "Select Avatar" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Select Avatar
              </h2>
              <select
                value={selectedAvatar}
                onChange={(e) => setSelectedAvatar(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an avatar</option>
                {avatars.map((avatar) => (
                  <option key={avatar.id} value={avatar.id}>
                    {avatar.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAvatarUpdate}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300"
              >
                Update Avatar
              </button>
            </div>
          )}

          {activeSection === "Your Spaces" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Your Spaces
              </h2>
              {spaces.length === 0 ? (
                <p className="text-gray-600">No spaces available.</p>
              ) : (
                spaces.map((space) => (
                  <div
                    key={space.id}
                    className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <span className="text-gray-700">
                      {space.name} ({space.dimensions})
                    </span>
                    <button
                      onClick={() => navigate(`/space/${space.id}`)}
                      className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all duration-300"
                    >
                      View Space
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
