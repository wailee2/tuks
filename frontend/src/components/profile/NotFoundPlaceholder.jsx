// components/NotFoundPlaceholder.jsx
import { useNavigate } from "react-router-dom";

export default function NotFoundPlaceholder({ title = "Not Found", message = "We couldn’t find what you were looking for.", actionLabel = "Go Home" }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center p-10">
        <div className="w-30 h-30 border-2 border-b-gray-200 rounded-full">
            <img
                src="/illustrations/empty-state.svg" // <-- you can replace this with your own placeholder image or remove it
                alt="Not Found"
                className="w-48 h-48 mb-6 opacity-80"
            />
        </div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h1>
      <p className="text-gray-500 mb-6">{message}</p>
      <button
        onClick={() => navigate("/")}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        {actionLabel}
      </button>
    </div>
  );
}
