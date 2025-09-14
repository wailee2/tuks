// src/App.jsx
import { useEffect, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { useSocket } from "./services/socket";
import AppRoutes from "./routes";

function App() {
  const { token } = useContext(AuthContext);
  const { isConnected } = useSocket(token);

  useEffect(() => {
    if (token) {
      console.log("Socket connected:", isConnected);
    }
  }, [token, isConnected]);

  return <AppRoutes />;
}

export default App;
