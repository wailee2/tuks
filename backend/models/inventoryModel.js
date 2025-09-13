const pool = require('../config/db');

// Get all products for a user (or all if admin)
const getAllProducts = async (userId, isAdmin=false) => {
  let query = 'SELECT p.*, s.name AS supplier_name FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id';
  const params = [];

  if (!isAdmin) {
    query += ' WHERE p.user_id=$1';
    params.push(userId);
  }

  query += ' ORDER BY p.id';
  const res = await pool.query(query, params);
  return res.rows;
};

// Get a single product
const getProductById = async (id) => {
  const res = await pool.query('SELECT * FROM products WHERE id=$1', [id]);
  return res.rows[0];
};

// Create a product
const createProduct = async (user_id, name, description, category, supplier_id, purchase_price, retail_price, stock_quantity, reorder_level, is_available=false, market_price=null) => {
  const res = await pool.query(
    `INSERT INTO products
    (user_id, name, description, category, supplier_id, purchase_price, retail_price, stock_quantity, reorder_level, is_available, market_price)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [user_id, name, description, category, supplier_id, purchase_price, retail_price, stock_quantity, reorder_level, is_available, market_price]
  );
  return res.rows[0];
};

// Update product (checks ownership)
const updateProduct = async (id, user_id, fields) => {
  const setString = Object.keys(fields)
    .map((key, idx) => `${key}=$${idx+1}`)
    .join(', ');
  const values = Object.values(fields);
  values.push(id, user_id);

  const res = await pool.query(
    `UPDATE products SET ${setString}, updated_at=NOW() WHERE id=$${values.length-1} AND user_id=$${values.length} RETURNING *`,
    values
  );
  return res.rows[0];
};

// Delete product (checks ownership)
const deleteProduct = async (id, user_id) => {
  const res = await pool.query('DELETE FROM products WHERE id=$1 AND user_id=$2 RETURNING *', [id, user_id]);
  return res.rows[0];
};

// Get all available products for marketplace
const getMarketplaceProducts = async () => {
  const res = await pool.query('SELECT p.*, u.name AS owner_name, s.name AS supplier_name FROM products p LEFT JOIN users u ON p.user_id=u.id LEFT JOIN suppliers s ON p.supplier_id=s.id WHERE is_available=TRUE ORDER BY p.id');
  return res.rows;
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMarketplaceProducts
};
