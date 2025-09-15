import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <OrderProvider>
          <App />
          <ToastContainer />
        </OrderProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
