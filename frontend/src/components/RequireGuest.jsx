import { Navigate } from "react-router-dom";
import { getAuth, getDefaultRoute } from "../utils/auth";

export default function RequireGuest({ children }) {
  const { token, role } = getAuth();

  if (token) {
    return <Navigate to={getDefaultRoute(role)} replace />;
  }

  return children;
}
