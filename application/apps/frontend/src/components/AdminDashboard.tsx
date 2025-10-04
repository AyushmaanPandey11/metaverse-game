import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createElement, createAvatar, createMap, getSpaces } from "../api";
import type { User, Space } from "../types";

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [elementImageUrl, setElementImageUrl] = useState("");
  const [elementWidth, setElementWidth] = useState(1);
  const [elementHeight, setElementHeight] = useState(1);
  const [elementStatic, setElementStatic] = useState(true);
  const [avatarImageUrl, setAvatarImageUrl] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [mapName, setMapName] = useState("");
  const [mapThumbnail, setMapThumbnail] = useState("");
  const [mapDimensions, setMapDimensions] = useState("");
  const [mapElements, setMapElements] = useState<
    { elementId: string; x: number; y: number }[]
  >([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpaces = async () => {
      const response = await getSpaces(user.token);
      if (response.status === 200) {
        setSpaces(response.data.spaces);
      }
    };
    fetchSpaces();
  }, [user.token]);

  const handleCreateElement = async () => {
    const response = await createElement(
      elementImageUrl,
      elementWidth,
      elementHeight,
      elementStatic,
      user.token
    );
    if (response.status === 200) {
      alert("Element created");
      setElementImageUrl("");
      setElementWidth(1);
      setElementHeight(1);
      setElementStatic(true);
    }
  };

  const handleCreateAvatar = async () => {
    const response = await createAvatar(avatarImageUrl, avatarName, user.token);
    if (response.status === 200) {
      alert("Avatar created");
      setAvatarImageUrl("");
      setAvatarName("");
    }
  };

  const handleCreateMap = async () => {
    const response = await createMap(
      mapName,
      mapThumbnail,
      mapDimensions,
      mapElements,
      user.token
    );
    if (response.status === 200) {
      alert("Map created");
      setMapName("");
      setMapThumbnail("");
      setMapDimensions("");
      setMapElements([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
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
          <h2 className="text-xl font-bold mb-4">Create Element</h2>
          <input
            type="text"
            placeholder="Image URL"
            value={elementImageUrl}
            onChange={(e) => setElementImageUrl(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="number"
            placeholder="Width"
            value={elementWidth}
            onChange={(e) => setElementWidth(Number(e.target.value))}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="number"
            placeholder="Height"
            value={elementHeight}
            onChange={(e) => setElementHeight(Number(e.target.value))}
            className="w-full p-2 border rounded mb-4"
          />
          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={elementStatic}
              onChange={(e) => setElementStatic(e.target.checked)}
              className="mr-2"
            />
            Static
          </label>
          <button
            onClick={handleCreateElement}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Create Element
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Create Avatar</h2>
          <input
            type="text"
            placeholder="Image URL"
            value={avatarImageUrl}
            onChange={(e) => setAvatarImageUrl(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="text"
            placeholder="Avatar Name"
            value={avatarName}
            onChange={(e) => setAvatarName(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <button
            onClick={handleCreateAvatar}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Create Avatar
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Create Map</h2>
          <input
            type="text"
            placeholder="Map Name"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="text"
            placeholder="Thumbnail URL"
            value={mapThumbnail}
            onChange={(e) => setMapThumbnail(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="text"
            placeholder="Dimensions (e.g., 100x200)"
            value={mapDimensions}
            onChange={(e) => setMapDimensions(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <button
            onClick={handleCreateMap}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Create Map
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-xl font-bold mb-4">All Spaces</h2>
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

export default AdminDashboard;
