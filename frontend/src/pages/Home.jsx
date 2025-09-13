export default function Home() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome to BizSocial</h1>
      <p className="text-gray-700 mb-6">
        Manage your business and connect with others in one place.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Inventory Card */}
        <div className="border rounded-lg p-4 shadow hover:shadow-md transition">
          <h2 className="font-semibold text-lg mb-2">📦 Inventory</h2>
          <p className="text-sm text-gray-600">
            Add, edit, and track your products in real-time.
          </p>
          <a
            href="/inventory"
            className="mt-3 inline-block bg-blue-500 text-white px-3 py-1 rounded"
          >
            Go
          </a>
        </div>

        {/* Messages Card */}
        <div className="border rounded-lg p-4 shadow hover:shadow-md transition">
          <h2 className="font-semibold text-lg mb-2">💬 Messages</h2>
          <p className="text-sm text-gray-600">
            Chat with businesses, partners, and customers.
          </p>
          <a
            href="/messages"
            className="mt-3 inline-block bg-blue-500 text-white px-3 py-1 rounded"
          >
            Go
          </a>
        </div>

        {/* Analytics Card */}
        <div className="border rounded-lg p-4 shadow hover:shadow-md transition">
          <h2 className="font-semibold text-lg mb-2">📊 Analytics</h2>
          <p className="text-sm text-gray-600">
            Track your sales, expenses, and growth trends.
          </p>
          <a
            href="/analytics"
            className="mt-3 inline-block bg-blue-500 text-white px-3 py-1 rounded"
          >
            Go
          </a>
        </div>
      </div>
    </div>
  );
}
