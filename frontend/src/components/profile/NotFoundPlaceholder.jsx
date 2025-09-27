// components/NotFoundPlaceholder.jsx
import { useNavigate } from "react-router-dom";

export default function NotFoundPlaceholder({ title = "Not Found", message = "We couldn’t find what you were looking for.", actionLabel = "Go Home" }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center p-10">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h1>
      <p className="text-gray-500 mb-6">{message}</p>
      <button
        onClick={() => navigate("/")}
        className="px-4 py-2 bg-green-700 text-white rounded-full cursor-pointer hover:bg-green-800"
      >
        {actionLabel}
      </button>
    </div>
  );
}
