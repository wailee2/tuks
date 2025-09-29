// routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  addProduct,
  getUserInventory,
  updateProductController,
  deleteProductController,
  getMarketplaceProducts,
  getProductByIdController // ← new
} = require('../controllers/inventoryController');

router.get('/user', authMiddleware, getUserInventory);
router.post('/', authMiddleware, addProduct);
router.put('/:id', authMiddleware, updateProductController);
router.delete('/:id', authMiddleware, deleteProductController);
router.get('/marketplace', authMiddleware, getMarketplaceProducts);

// NEW: get single product by id (must be after /marketplace)
router.get('/:id', authMiddleware, getProductByIdController);

module.exports = router;
