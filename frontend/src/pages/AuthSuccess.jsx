// pages/AuthSuccess.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api"; // central axios instance

export default function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const finishLogin = async () => {
      try {
        // ✅ fetch user, cookie will be sent automatically
        const res = await api.get("/auth/me", { withCredentials: true });

        localStorage.setItem("user", JSON.stringify(res.data));

        // redirect to dashboard
        navigate("/dashboard");
      } catch (err) {
        console.error("Failed to fetch user after Google login", err);
        navigate("/login");
      }
    };

    finishLogin();
  }, [navigate]);

  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-gray-600">Signing you in with Google...</p>
    </div>
  );
}
