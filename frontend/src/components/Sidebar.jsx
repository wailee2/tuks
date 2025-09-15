import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useContext } from "react";
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
  const { user } = useContext(AuthContext);
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
    { name: "Feed", path: "/feed", icon: <FiRss aria-hidden /> },
    { name: "Analytics", path: "/analytics", icon: <FiBarChart2 aria-hidden /> },
    { name: "Marketplace", path: "/marketplace", icon: <FiShoppingCart aria-hidden /> },
    { name: "Messages", path: "/messages", icon: <FiMessageSquare aria-hidden /> },
    { name: "Notifications", path: "/notifications", icon: <FiBell aria-hidden /> },
    { name: "Cart", path: "/cart", icon: <FiShoppingCart aria-hidden /> },
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

  return (
    <aside
      className={`${sidebarWidthClass} ${hideNavPages ? "hidden md:flex" : ""} ${noNav ? "hidden" : ""} bg-green-200 md:h-screen p-4 shadow-lg flex flex-col transition-all duration-200 ease-in-out overflow-hidden fixed bottom-0 left-0 right-0 md:sticky md:top-0 z-50`}
    >
      {/* Logo */}
      <div className={`hidden  md:flex items-center mb-4 ${iconOnlyMode ? "justify-center" : "justify-center lg:justify-start"}`}>
        <FiHeart className="text-red-500 w-6 h-6" aria-hidden />
        <span className={`font-bold text-xl ml-2 ${textVisibilityClass}`}>Tuks</span>
      </div>

      {/* Nav: horizontal on small, vertical from md up */}
      <nav className="flex md:flex-col md:space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.name}
            className={({ isActive }) =>
              `flex items-center ${linkJustifyClass} ${spacingClass} px-4 py-2 rounded hover:bg-green-200 transition-all duration-150
               ${isActive ? "bg-green-500 text-white" : "text-gray-700"} flex-1 md:flex-none`
            }
          >
            <span className="text-2xl flex-shrink-0">{item.icon}</span>
            <span className={`${textVisibilityClass} text-left`}>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
