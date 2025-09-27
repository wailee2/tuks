import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // optional, sane default
      staleTime: 1000 * 60 * 5,    // 5 minutes stale
      cacheTime: 1000 * 60 * 30,   // keep cache for 30 minutes
    },
  },
})


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <OrderProvider>
            <App />
            <ToastContainer />
          </OrderProvider>
        </AuthProvider>
      </ToastProvider>
    </ QueryClientProvider>
  </React.StrictMode>
);
