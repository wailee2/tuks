// pages/AuthSuccess.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // save token
      localStorage.setItem("token", token);

      // optional: you can decode user info here with jwt-decode if needed
      // const user = jwtDecode(token);
      // localStorage.setItem("user", JSON.stringify(user));

      // redirect user
      navigate("/dashboard");
    } else {
      // if no token, send back to login
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-gray-600">Signing you in with Google...</p>
    </div>
  );
}
