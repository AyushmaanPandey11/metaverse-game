import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createElement,
  createAvatar,
  createMap,
  getSpaces,
  getMaps,
} from "../api";
import { ImagePreview } from "./ImagePreview";
import type { User, Space } from "../types";

interface Map {
  id: string;
  name: string;
  height: number;
  width: number;
  thumbnail: string;
}

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [maps, setMaps] = useState<Map[]>([]);
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
  const [activeSection, setActiveSection] = useState("Create Avatar");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const spacesResponse = await getSpaces(user.token);
      if (spacesResponse.status === 200) {
        setSpaces(spacesResponse.data.spaces);
      }
      const mapsResponse = await getMaps();
      if (mapsResponse.status === 200) {
        setMaps(mapsResponse.data.maps);
      }
    };
    fetchData();
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

  const sections = [
    "Create Element",
    "Create Avatar",
    "Create Map",
    "All Spaces",
    "All Maps",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Vertical Navbar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
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
            localStorage.clear();
            navigate("/login");
          }}
          className="m-6 bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition-all duration-300"
        >
          Logout
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8 animate-fade-in">
          {activeSection === "Create Element" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Create Element
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <div className="flex items-end space-x-4">
                  <input
                    type="text"
                    placeholder="Enter image URL"
                    value={elementImageUrl}
                    onChange={(e) => setElementImageUrl(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ImagePreview
                    imageUrl={elementImageUrl}
                    altText="Element Preview"
                    size="w-20 h-20"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width
                </label>
                <input
                  type="number"
                  placeholder="Width"
                  value={elementWidth}
                  onChange={(e) => setElementWidth(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height
                </label>
                <input
                  type="number"
                  placeholder="Height"
                  value={elementHeight}
                  onChange={(e) => setElementHeight(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={elementStatic}
                    onChange={(e) => setElementStatic(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Static</span>
                </label>
              </div>

              <button
                onClick={handleCreateElement}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300"
              >
                Create Element
              </button>
            </div>
          )}

          {activeSection === "Create Avatar" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Create Avatar
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <div className="flex items-end space-x-4">
                  <input
                    type="text"
                    placeholder="Enter image URL"
                    value={avatarImageUrl}
                    onChange={(e) => setAvatarImageUrl(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ImagePreview
                    imageUrl={avatarImageUrl}
                    altText="Avatar Preview"
                    size="w-20 h-20"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar Name
                </label>
                <input
                  type="text"
                  placeholder="Avatar Name"
                  value={avatarName}
                  onChange={(e) => setAvatarName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleCreateAvatar}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300"
              >
                Create Avatar
              </button>
            </div>
          )}

          {activeSection === "Create Map" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Create Map
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Map Name
                </label>
                <input
                  type="text"
                  placeholder="Map Name"
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail URL
                </label>
                <div className="flex items-end space-x-4">
                  <input
                    type="text"
                    placeholder="Enter thumbnail URL"
                    value={mapThumbnail}
                    onChange={(e) => setMapThumbnail(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ImagePreview
                    imageUrl={mapThumbnail}
                    altText="Map Thumbnail Preview"
                    size="w-20 h-20"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions (e.g., 100x200)
                </label>
                <input
                  type="text"
                  placeholder="Dimensions (e.g., 100x200)"
                  value={mapDimensions}
                  onChange={(e) => setMapDimensions(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleCreateMap}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300"
              >
                Create Map
              </button>
            </div>
          )}

          {activeSection === "All Spaces" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                All Spaces
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

          {activeSection === "All Maps" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                All Maps
              </h2>
              {maps?.length === 0 ? (
                <p className="text-gray-600">No maps available.</p>
              ) : (
                maps?.map((map) => (
                  <div
                    key={map.id}
                    className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      {map.thumbnail && (
                        <img
                          src={map.thumbnail}
                          alt={map.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <span className="text-gray-700">
                        {map.name} ({map.width}x{map.height})
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/space/${map.id}`)}
                      className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all duration-300"
                    >
                      View Map
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

export default AdminDashboard;
