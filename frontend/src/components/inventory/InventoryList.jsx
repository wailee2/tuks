// components/inventory/InventoryList.jsx
import React, { useState, useMemo } from 'react';
import { deleteProduct } from '../../services/inventory';
import { useToasts } from '../../context/ToastContext';
import LoadingSpinner from "../LoadingSpinner";
import { Link } from 'react-router-dom';
import { Search } from "lucide-react";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBinFill } from "react-icons/ri";
import { motion } from "framer-motion";

export default function InventoryList({ products = [], onEdit, fetchProducts, loading }) {
  const { addToast } = useToasts();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // default sort

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct(id);
      addToast('Product deleted', 'success');
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      addToast('Failed to delete product', 'error');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products || [];
    if (q) {
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'stock') return (b.stock_quantity || 0) - (a.stock_quantity || 0);
      if (sortBy === 'price') return (b.retail_price || 0) - (a.retail_price || 0);
      return 0;
    });
    return list;
  }, [products, query, sortBy]);

  if (loading) return <LoadingSpinner message="Loading inventory..." />;

  return (
    <div className="">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 w-full md:w-sm border border-gray-200 rounded-full shadow-sm px-4 py-2.5">
            <Search className="h-5 w-5 text-gray-400 "/>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or category"
              className="flex-1 outline-none text-[16px] text-gray-800 "
            />
          </div>
        </div>
        

        <div className='flex gap-3 items-center'>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="hidden text-gray-600 shadow-sm rounded-full border border-gray-300 text-sm px-4 py-2.5 sflex items-center justify-between gap-3"
          >
            <option value="name">Sort: Name</option>
            <option value="stock">Sort: Stock (desc)</option>
            <option value="price">Sort: Price (desc)</option>
          </select>
        
          <div className="text-sm w-fit px-3 py-2 shadow-sm border border-gray-200 rounded-full text-gray-500">{filtered.length} items</div>

          <Link
            to="/inventory/new"
            className="text-white bg-green-700 shadow-sm rounded-full border border-gray-300 text-sm px-4 py-2.5 flex items-center justify-between gap-3 "
          >
            {/* optional icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Add Product
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-gray-500">No products found.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border-gray-200 border-1 shadow">
          <table className="w-full table-auto border-collapse">
            <thead className='bg-gray-100'>
              <tr className="text-left text-[13px] text-gray-500 font-extralight">
                <th className="p-3">Name</th>
                <th className="p-3 hidden sm:table-cell">Category</th>
                <th className="p-3">Stock</th>
                <th className="p-3 hidden md:table-cell">Retail</th>
                <th className="p-3">Available</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-3 align-top">{product.name}</td>
                  <td className="p-3 hidden sm:table-cell align-top">{product.category}</td>
                  <td className="p-3 align-top">{product.stock_quantity}</td>
                  <td className="p-3 hidden md:table-cell align-top">${product.retail_price}</td>
                  <td className="p-3 align-top">{product.is_available ? 'Yes' : 'No'}</td>
                  <td className="p-3 align-top text-right flex items-center justify-end gap-3">
                    <motion.button
                      onClick={() => onEdit && onEdit(product)}
                      className="p-2 text-gray-600 text-sm border border-gray-200 rounded-full shadow-sm cursor-pointer"
                      whileHover={{ scale: 1.2, opacity: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <FiEdit />
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-gray-600 text-sm border border-gray-200 rounded-full shadow-sm cursor-pointer"
                      whileHover={{ scale: 1.2, opacity: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <RiDeleteBinFill />
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
