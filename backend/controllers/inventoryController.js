const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMarketplaceProducts
} = require('../models/inventoryModel');

// Fetch logged-in user’s products
const fetchAllProducts = async (req, res) => {
  try {
    const products = await getAllProducts(req.user.id, req.user.role==='ADMIN');
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fetch single product
const fetchProductById = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add new product
const addProduct = async (req, res) => {
  try {
    const { name, description, category, supplier_id, purchase_price, retail_price, stock_quantity, reorder_level, is_available, market_price } = req.body;
    const product = await createProduct(req.user.id, name, description, category, supplier_id, purchase_price, retail_price, stock_quantity, reorder_level, is_available, market_price);
    res.status(201).json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Edit product
const editProduct = async (req, res) => {
  try {
    const fields = req.body;
    const product = await updateProduct(req.params.id, req.user.id, fields);
    if (!product) return res.status(403).json({ message: 'You can only edit your own products' });
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete product
const removeProduct = async (req, res) => {
  try {
    const product = await deleteProduct(req.params.id, req.user.id);
    if (!product) return res.status(403).json({ message: 'You can only delete your own products' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all available products in marketplace
const fetchMarketplaceProducts = async (req, res) => {
  try {
    const products = await getMarketplaceProducts();
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  fetchAllProducts,
  fetchProductById,
  addProduct,
  editProduct,
  removeProduct,
  fetchMarketplaceProducts
};
