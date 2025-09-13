import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import AppRoutes from './routes';

function App() {
  return (
    <OrderProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </OrderProvider>
  );
}

export default App;
