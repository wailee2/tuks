export default function MarketplaceCard({ product }) {
  return (
    <div className="bg-white p-4 shadow rounded border">
      <h3 className="text-lg font-bold">{product.name}</h3>
      <p className="text-gray-600">{product.category}</p>
      <p>Owner: <span className="font-medium">{product.owner_name}</span></p>
      <p>Stock: {product.stock_quantity}</p>
      <p>Price: ${product.market_price ?? product.retail_price}</p>
      {product.description && <p className="text-gray-700 mt-1">{product.description}</p>}
    </div>
  );
}
