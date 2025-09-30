// components/Sidebar.jsx
import React, { useContext } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
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

import { TbLayoutDashboardFilled, TbMessage2Filled } from "react-icons/tb";
import { MdManageAccounts, MdInventory } from "react-icons/md";
import { BiSupport } from "react-icons/bi";
import { IoNotifications } from "react-icons/io5";
import { FaCartShopping } from "react-icons/fa6";
import { VscTerminalUbuntu } from "react-icons/vsc";


function Sidebar() {
  const { user, profile } = useContext(AuthContext);
  const location = useLocation();

  // icon-only pages
  const iconOnlyMode = ["/messages", "/support", "/manage-users" ].includes(location.pathname);

  // pages where nav should be hidden by default, visible on large
  const hideNavPages = ["/messages", "/support"].includes(location.pathname);

  // pages where nav should be hidden completely
  const noNav = ["/login", "/register", "/reset-password", "/forgot-password"].includes(location.pathname);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <TbLayoutDashboardFilled aria-hidden /> },
    { name: "Inventory", path: "/inventory", icon: <MdInventory aria-hidden /> },
    //{ name: "Orders", path: "/orders", icon: <FiShoppingBag aria-hidden /> },
    //{ name: "Feed", path: "/feed", icon: <FiRss aria-hidden /> },
    //{ name: "Analytics", path: "/analytics", icon: <FiBarChart2 aria-hidden /> },
    { name: "Marketplace", path: "/marketplace", icon: <FaCartShopping aria-hidden /> },
    //{ name: "Messages", path: "/messages", icon: <TbMessage2Filled aria-hidden /> },
    //{ name: "Notifications", path: "/notifications", icon: <IoNotifications aria-hidden /> },
    //{ name: "Cart", path: "/cart", icon: <FiShoppingCart aria-hidden /> },
    { name: "Support", path: "/support", icon: <BiSupport aria-hidden /> },
    ...((user?.role === "ADMIN" || user?.role === "OWNER")
      ? [{ name: "Manage Users", path: "/manage-users", icon: <MdManageAccounts aria-hidden /> }]
      : []),

  ];

  // responsive sizing: full-width bottom on small, narrow at md, larger at lg
  const sidebarWidthClass = iconOnlyMode ? " w-full md:w-18 " : "w-full md:w-18 xl:w-61";

  // alignment: centered icons by default, left-justify from md
  const linkJustifyClass = iconOnlyMode ? "bg-transparent justify-center" : " md:justify-center xl:justify-start";

  // show text at lg (per your request); iconOnlyMode keeps labels sr-only
  const textVisibilityClass = iconOnlyMode ? "sr-only" : "hidden xl:inline";

  // spacing: gap appears at lg
  const spacingClass = iconOnlyMode ? "space-x-0" : "space-x-0 xl:space-x-3";

  const avatar = profile?.profile_pic || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%23ddd'/><circle cx='24' cy='18' r='8' fill='%23fff'/><path d='M12 40c0-6.627 5.373-12 12-12h0c6.627 0 12 5.373 12 12' fill='%23fff'/></svg>";


  // choose profile or fallback to user (server might put avatar on user object)
  const avatarUrl = profile?.profile_pic || user?.profile_pic || null;

  // add cache-busting query so updated file is re-fetched (avoid stale image in browser cache)
  const addCacheBust = (url) => {
    if (!url) return null;
    const stamp = (profile && profile.updatedAt) ? encodeURIComponent(profile.updatedAt) : Date.now();
    return url + (url.includes('?') ? '&' : '?') + `v=${stamp}`;
  };



  const displayName = user?.name || user?.username || "Guest";



  return (
    <aside
      className={`
        ${sidebarWidthClass}
        ${hideNavPages ? "hidden md:flex" : ""}
        ${noNav ? "hidden" : ""} 
        bg-white md:h-screen md:py-4 px-4 md:px-3 xl:px-4 shadow-lg flex md:flex-col gap-5 md:gap-0 transition-all duration-200 ease-in-out overflow-hidden fixed bottom-0 left-0 right-0 md:sticky md:top-0 z-50 justify-between
      `}
    >
      {/* Logo */}
      <Link
        className={`
          hidden md:flex items-center mb-4 group cursor-pointer
          ${iconOnlyMode ? "justify-center" : "justify-center xl:justify-start"}
        `}
        to="/"
      >
        <VscTerminalUbuntu className="text-green-700 w-7 h-7 group-hover:text-green-800 transition" aria-hidden />
        <span className={`font-semibold tracking-tighter text-xl ml-2 ${textVisibilityClass}`}>Tuks</span>
      </Link>

      {/* Nav: horizontal on small, vertical from md up */}
      <nav className="flex md:flex-col md:space-y-2 w-full gap-[5%] bg-white">
        {navItems.map((item) => {
          const hideOnSmall = ["Notifications", "Inventory", "Orders", "Marketplace", "Cart", "Analytics"].includes(item.name);
          const baseLayout = hideOnSmall ? "hidden md:flex" : "flex";

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.name}
              className={({ isActive }) =>
                `${baseLayout} items-center justify-center
                ${linkJustifyClass}
                ${spacingClass}  px-2.5 py-2.5 rounded-lg hover:bg-gray-100 transition-all duration-150 ${
                  isActive ? "bg-gray-100 text-green-700 font-bold" : "text-gray-500"
                } md:flex-none w-full`
              }
            >
              <span className="text-[27px] flex-shrink-0">{item.icon}</span>
              <span className={`${textVisibilityClass} text-left`}>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Profile / guest area */}
      <div className={` ${iconOnlyMode ? "w-full flex items-center justify-center  " : "flex items-center lg:justify-start lg:items-center  md:px-0 xl:px-2 xl:py-2 xl:hover:bg-gray-200 rounded-full"}`}>
        {user ? (
          // logged-in user -> clicking goes to /:username
          <NavLink
            to={`/${encodeURIComponent(user.username)}`}
            className="flex items-center justify-center gap-3 w-full"
            title={`View profile @${user.username}`}
          >
            <div className="w-10 h-10 overflow-hidden rounded-full">
              <img
                src={avatar}
                alt={profile?.username || "User"}
                className="w-full h-full  object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/default-avatar.png";
                }}
              />
            </div>
            <div className={`flex-1  ${textVisibilityClass}`}>
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