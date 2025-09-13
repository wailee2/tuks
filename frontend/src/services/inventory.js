import API from "./api";

export const getProducts = async () => {
  const res = await API.get("/inventory");
  return res.data;
};

export const createProduct = async (product) => {
  const res = await API.post("/inventory", product);
  return res.data;
};

export const updateProduct = async (id, product) => {
  const res = await API.patch(`/inventory/${id}`, product);
  return res.data;
};

export const deleteProduct = async (id) => {
  const res = await API.delete(`/inventory/${id}`);
  return res.data;
};
