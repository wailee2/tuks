import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-gray-600 mb-6">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/dashboard"
        className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
