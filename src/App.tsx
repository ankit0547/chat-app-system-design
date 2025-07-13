import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./router/Routing";
import { Suspense } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <ToastContainer />
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
