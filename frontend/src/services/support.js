// services/support.js
import api from './api.js';

const sendAppeal = async (token, payload) => {
  const res = await api.post('/support/appeal', payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export default { sendAppeal };
