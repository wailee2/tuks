export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full md:w-1/2 border px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
    />
  );
}
