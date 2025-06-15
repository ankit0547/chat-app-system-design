// components/NavigationListener.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearRedirect } from "../../redux/actions/app";
import { AppState } from "../../types/types";
// import { RootState } from "../store";
// import { clearNavigation } from "../store/slices/authSlice";

export const NavigationListener = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const path = useSelector((state: AppState) => state.redirectPath);

  useEffect(() => {
    if (path) {
      navigate(path);
      dispatch(clearRedirect()); // ✅ Clear path after navigation
    }
  }, [path, navigate, dispatch]);

  return null; // This component doesn't render anything
};
