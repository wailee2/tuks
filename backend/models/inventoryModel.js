const pool = require('../config/db');

const safeNumber = (val, defaultValue = 0) => {
  const num = Number(val);
  return isNaN(num) ? defaultValue : num;
};

const createProduct = async (user_id, data) => {
  const {
    name,
    description = '',
    category = '',
    supplier_id = null,
    purchase_price,
    retail_price,
    stock_quantity,
    reorder_level,
    is_available = false,
    market_price
  } = data;

  const result = await pool.query(
    `INSERT INTO products 
      (user_id, name, description, category, supplier_id, purchase_price, retail_price, stock_quantity, reorder_level, is_available, market_price)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      user_id,
      name,
      description,
      category,
      supplier_id ? safeNumber(supplier_id, null) : null,
      safeNumber(purchase_price),
      safeNumber(retail_price),
      safeNumber(stock_quantity),
      safeNumber(reorder_level),
      is_available,
      safeNumber(market_price)
    ]
  );

  return result.rows[0];
};

const getUserProducts = async (user_id) => {
  const res = await pool.query(`SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC`, [user_id]);
  return res.rows;
};

const updateProduct = async (id, user_id, data) => {
  const {
    name,
    description,
    category,
    supplier_id,
    purchase_price,
    retail_price,
    stock_quantity,
    reorder_level,
    is_available,
    market_price
  } = data;

  const res = await pool.query(
    `UPDATE products SET
      name=$1,
      description=$2,
      category=$3,
      supplier_id=$4,
      purchase_price=$5,
      retail_price=$6,
      stock_quantity=$7,
      reorder_level=$8,
      is_available=$9,
      market_price=$10
     WHERE id=$11 AND user_id=$12
     RETURNING *`,
    [
      name, description, category, supplier_id ? safeNumber(supplier_id, null) : null,
      safeNumber(purchase_price), safeNumber(retail_price),
      safeNumber(stock_quantity), safeNumber(reorder_level),
      is_available, safeNumber(market_price),
      id, user_id
    ]
  );
  return res.rows[0];
};

const deleteProduct = async (id, user_id) => {
  const res = await pool.query(`DELETE FROM products WHERE id=$1 AND user_id=$2 RETURNING *`, [id, user_id]);
  return res.rows[0];
};

module.exports = { createProduct, getUserProducts, updateProduct, deleteProduct };
