// pages/InventoryForm
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import InventoryForm from '../components/inventory/InventoryForm';
import { getProductById } from '../services/inventory';
import { useToasts } from '../context/ToastContext';

export default function InventoryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToasts();
  const [initialData, setInitialData] = useState(null);
  const isEdit = Boolean(id);

  useEffect(() => {
    (async () => {
      if (!isEdit) {
        setInitialData(null);
        return;
      }

      // 1) prefer product passed through navigation state to avoid extra fetch
      const fromState = location.state?.product;
      if (fromState) {
        setInitialData(fromState);
        return;
      }

      // 2) fallback: fetch by id
      try {
        const p = await getProductById((id));
        if (!p) {
          addToast('Product not found', 'error');
          navigate('/inventory'); // go back to list
          return;
        }
        setInitialData(p);
      } catch (err) {
        console.error(err);
        addToast('Failed to load product', 'error');
        navigate('/inventory');
      }
    })();
  }, [id]);

  const handleSuccess = () => {
    addToast(isEdit ? 'Product updated' : 'Product added', 'success');
    navigate('/inventory');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <p className="text-sm text-gray-500">{isEdit ? 'Update the product details.' : 'Create a new product.'}</p>
        </div>
        <div>
          <Link to="/inventory" className="text-sm text-gray-600 hover:underline">Back to Inventory</Link>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6">
        <InventoryForm
          initialData={initialData}
          mode={isEdit ? 'edit' : 'create'}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
