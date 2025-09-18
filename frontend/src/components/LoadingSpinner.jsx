// components/LoadingSpinner.jsx
export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>

      {/* Message */}
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
