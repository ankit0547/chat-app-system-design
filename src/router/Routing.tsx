import { Route, Routes } from "react-router-dom";
import Dashboard from "../components/Dashboard/Dashboard";
import NotFound from "../components/NotFound/NotFound";
import PrivateRoute from "../hooks/PrivateRoutes";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import Contacts from "../pages/Contacts";
import Settings from "../pages/Settings";
import SignIn from "../components/SignIn/SignIn";
import SignUp from "../components/SignUp/SignUp";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<SignIn />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/register" element={<SignUp />} />
      {/* Protected /dashboard routes */}
      <Route path="/*" element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={"chats"} element={<Dashboard />} />
          <Route path={"contacts"} element={<Contacts />} />
          <Route path={"settings"} element={<Settings />} />
          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
