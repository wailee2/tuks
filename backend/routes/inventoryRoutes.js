const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  addProduct,
  getUserInventory,
  updateProductController,
  deleteProductController,
  getMarketplaceProducts
} = require('../controllers/inventoryController');

router.get('/user', authMiddleware, getUserInventory);
router.post('/', authMiddleware, addProduct);
router.put('/:id', authMiddleware, updateProductController);
router.delete('/:id', authMiddleware, deleteProductController);
router.get('/marketplace', authMiddleware, getMarketplaceProducts);


module.exports = router;


