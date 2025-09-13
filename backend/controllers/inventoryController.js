// controllers/inventoryController.js
const { addProduct, getProducts, updateProduct, deleteProduct } = require('../models/inventoryModel');

const createProduct = async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    const product = await addProduct(req.user.id, name, quantity, price);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const listProducts = async (req, res) => {
  try {
    const products = await getProducts(req.user.id);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const editProduct = async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    const product = await updateProduct(req.params.id, name, quantity, price);
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const removeProduct = async (req, res) => {
  try {
    const product = await deleteProduct(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createProduct, listProducts, editProduct, removeProduct };
