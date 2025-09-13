const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const {
  fetchAllProducts,
  fetchProductById,
  addProduct,
  editProduct,
  removeProduct,
  fetchMarketplaceProducts
} = require('../controllers/inventoryController');

// All routes require login
router.use(authMiddleware);

// User inventory
router.get('/', fetchAllProducts);
router.get('/:id', fetchProductById);
router.post('/', addProduct);
router.put('/:id', editProduct);
router.delete('/:id', removeProduct);

// Marketplace (public products)
router.get('/marketplace/all', fetchMarketplaceProducts);

module.exports = router;
