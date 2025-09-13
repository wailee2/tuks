// models/inventoryModel.js
const pool = require('../config/db');

const addProduct = async (userId, name, quantity, price) => {
  const res = await pool.query(
    'INSERT INTO inventory (user_id, name, quantity, price) VALUES ($1,$2,$3,$4) RETURNING *',
    [userId, name, quantity, price]
  );
  return res.rows[0];
};

const getProducts = async (userId) => {
  const res = await pool.query('SELECT * FROM inventory WHERE user_id=$1', [userId]);
  return res.rows;
};

const updateProduct = async (id, name, quantity, price) => {
  const res = await pool.query(
    'UPDATE inventory SET name=$1, quantity=$2, price=$3 WHERE id=$4 RETURNING *',
    [name, quantity, price, id]
  );
  return res.rows[0];
};

const deleteProduct = async (id) => {
  const res = await pool.query('DELETE FROM inventory WHERE id=$1 RETURNING *', [id]);
  return res.rows[0];
};

module.exports = { addProduct, getProducts, updateProduct, deleteProduct };
