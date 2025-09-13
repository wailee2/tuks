const pool = require('../config/db'); // <-- add this line

const { createProduct, getUserProducts, updateProduct, deleteProduct } = require('../models/inventoryModel');

const addProduct = async (req, res) => {
  try {
    const product = await createProduct(req.user.id, req.body);
    res.status(201).json(product);
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserInventory = async (req, res) => {
  try {
    const products = await getUserProducts(req.user.id);
    res.json(products);
  } catch (err) {
    console.error('Get user inventory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProductController = async (req, res) => {
  try {
    const product = await updateProduct(req.params.id, req.user.id, req.body);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProductController = async (req, res) => {
  try {
    const product = await deleteProduct(req.params.id, req.user.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted', product });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMarketplaceProducts = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE is_available = TRUE ORDER BY created_at DESC'
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get marketplace products error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { addProduct, getUserInventory, updateProductController, deleteProductController, getMarketplaceProducts };
