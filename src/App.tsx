import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./router/Routing";
import { Suspense } from "react";
function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
