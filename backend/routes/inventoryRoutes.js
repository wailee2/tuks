// routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const { createProduct, listProducts, editProduct, removeProduct } = require('../controllers/inventoryController');

router.post('/', createProduct);
router.get('/', listProducts);
router.patch('/:id', editProduct);
router.delete('/:id', removeProduct);

module.exports = router;
