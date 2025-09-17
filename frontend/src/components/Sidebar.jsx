// components/Sidebar.jsx
import React, { useContext, useEffect, useState } from "react";
import { getProfile } from "../services/profile";
import { NavLink, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  FiHome,
  FiBox,
  FiShoppingBag,
  FiRss,
  FiBarChart2,
  FiShoppingCart,
  FiMessageSquare,
  FiBell,
  FiUsers,
  FiHelpCircle,
  FiHeart,
} from "react-icons/fi";

function Sidebar() {
  const { user, token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const location = useLocation();

  // icon-only pages
  const iconOnlyMode = ["/messages", "/support"].includes(location.pathname);

  // pages where nav should be hidden by default, visible on large
  const hideNavPages = ["/messages", "/support"].includes(location.pathname);

  // pages where nav should be hidden completely
  const noNav = ["/login", "/register"].includes(location.pathname);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FiHome aria-hidden /> },
    { name: "Inventory", path: "/inventory", icon: <FiBox aria-hidden /> },
    { name: "Orders", path: "/orders", icon: <FiShoppingBag aria-hidden /> },
    //{ name: "Feed", path: "/feed", icon: <FiRss aria-hidden /> },
    //{ name: "Analytics", path: "/analytics", icon: <FiBarChart2 aria-hidden /> },
    { name: "Marketplace", path: "/marketplace", icon: <FiShoppingCart aria-hidden /> },
    { name: "Messages", path: "/messages", icon: <FiMessageSquare aria-hidden /> },
    { name: "Notifications", path: "/notifications", icon: <FiBell aria-hidden /> },
    //{ name: "Cart", path: "/cart", icon: <FiShoppingCart aria-hidden /> },
    { name: "Support", path: "/support", icon: <FiHelpCircle aria-hidden /> },
    ...(user?.role === "ADMIN"
      ? [{ name: "Manage Users", path: "/manage-users", icon: <FiUsers aria-hidden /> }]
      : []),
  ];

  // responsive sizing: full-width bottom on small, narrow at md, larger at lg
  const sidebarWidthClass = iconOnlyMode ? "w-full md:w-20" : "w-full md:w-20 lg:w-64";

  // alignment: centered icons by default, left-justify from md
  const linkJustifyClass = iconOnlyMode ? "justify-center" : "justify-center lg:justify-start";

  // show text at lg (per your request); iconOnlyMode keeps labels sr-only
  const textVisibilityClass = iconOnlyMode ? "sr-only" : "hidden lg:inline";

  // spacing: gap appears at lg
  const spacingClass = iconOnlyMode ? "space-x-0" : "space-x-0 lg:space-x-3";

  const avatar = profile?.profile_pic || "/default-avatar.png"; // adjust default path as needed
  const displayName = user?.name || user?.username || "Guest";

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.username || !token) return;
      try {
        const data = await getProfile(user.username, token); // same API call Profile.jsx uses
        setProfile(data);
      } catch (err) {
        console.error("Sidebar fetch profile failed", err);
      }
    };

    fetchProfile();
  }, [user, token]);

  return (
    <aside
      className={`${sidebarWidthClass} ${hideNavPages ? "hidden md:flex" : ""} ${noNav ? "hidden" : ""} bg-green-200 md:h-screen p-4 shadow-lg flex flex-col transition-all duration-200 ease-in-out overflow-hidden fixed bottom-0 left-0 right-0 md:sticky md:top-0 z-50`}
    >
      {/* Logo */}
      <div className={`hidden md:flex items-center mb-4 ${iconOnlyMode ? "justify-center" : "justify-center lg:justify-start"}`}>
        <FiHeart className="text-red-500 w-6 h-6" aria-hidden />
        <span className={`font-bold text-xl ml-2 ${textVisibilityClass}`}>Tuks</span>
      </div>

      {/* Nav: horizontal on small, vertical from md up */}
      <nav className="flex md:flex-col md:space-y-2 flex-1">
        {navItems.map((item) => {
          const hideOnSmall = ["Notifications", "Inventory", "Orders", "Marketplace", "Cart", "Analytics"].includes(item.name);
          const baseLayout = hideOnSmall ? "hidden md:flex" : "flex";

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.name}
              className={({ isActive }) =>
                `${baseLayout} items-center ${linkJustifyClass} ${spacingClass} px-4 py-2 rounded hover:bg-green-200 transition-all duration-150 ${
                  isActive ? "bg-green-500 text-white" : "text-gray-700"
                } flex-1 md:flex-none`
              }
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <span className={`${textVisibilityClass} text-left`}>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="hidden lg:block border-t border-green-300 my-3" />

      {/* Profile / guest area */}
      <div className={`mt-2 ${iconOnlyMode ? "flex items-center justify-center" : "flex items-center gap-3 lg:justify-start lg:items-center"}`}>
        {user ? (
          // logged-in user -> clicking goes to /:username
          <NavLink
            to={`/${encodeURIComponent(user.username)}`}
            className="flex items-center gap-3 hover:bg-green-100 px-2 py-1 rounded w-full"
            title={`View profile @${user.username}`}
          >
            <img
              src={avatar}
              alt={profile?.username || "User"}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/default-avatar.png";
              }}
            />
            <div className={`flex-1 ${textVisibilityClass}`}>
              <div className="text-sm font-medium truncate">{displayName}</div>
              <div className="text-xs text-gray-600">@{user.username}</div>
            </div>
          </NavLink>
        ) : (
          // guest -> link to login/register
          <div className={`flex items-center gap-3 px-2 py-1 rounded w-full ${iconOnlyMode ? "justify-center" : ""}`}>
            <NavLink to="/login" className="flex items-center gap-3 hover:bg-green-100 px-2 py-1 rounded w-full">
              <img src="/default-avatar.png" alt="Guest avatar" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              <div className={`flex-1 ${textVisibilityClass}`}>
                <div className="text-sm font-medium">Sign in</div>
                <div className="text-xs text-gray-600">Access your profile</div>
              </div>
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
