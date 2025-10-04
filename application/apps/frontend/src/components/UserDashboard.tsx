import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createSpace, getSpaces, getAvatars, updateAvatar } from "../api";
import type { User, Space, Avatar } from "../types";

interface UserDashboardProps {
  user: User;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [name, setName] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [mapId, setMapId] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600 mb-6"
        >
          Logout
        </button>

        <div className="bg-white p-6 rounded shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Create Space</h2>
          <input
            type="text"
            placeholder="Space Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="text"
            placeholder="Dimensions (e.g., 100x200)"
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="text"
            placeholder="Map ID (optional)"
            value={mapId}
            onChange={(e) => setMapId(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <button
            onClick={handleCreateSpace}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Create Space
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Select Avatar</h2>
          <select
            value={selectedAvatar}
            onChange={(e) => setSelectedAvatar(e.target.value)}
            className="w-full p-2 border rounded mb-4"
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
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Update Avatar
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-xl font-bold mb-4">Your Spaces</h2>
          {spaces.map((space) => (
            <div
              key={space.id}
              className="flex justify-between items-center mb-2"
            >
              <span>
                {space.name} ({space.dimensions})
              </span>
              <button
                onClick={() => navigate(`/space/${space.id}`)}
                className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
              >
                View Space
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
