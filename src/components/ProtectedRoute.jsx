import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import backend from "../api/backend.js";
import LoadingSpinner from "./LoadingSpinner";

const VERIFY_CACHE_MS = 60 * 1000;
let lastVerifySuccessAt = 0;
let verifyRequestPromise = null;

const verifyTokenWithCache = async () => {
  if (Date.now() - lastVerifySuccessAt < VERIFY_CACHE_MS) {
    return true;
  }

  if (!verifyRequestPromise) {
    verifyRequestPromise = backend
      .get("/auth/verify")
      .then((response) => {
        const ok = response.status === 200 && response.data?.success;
        if (ok) {
          lastVerifySuccessAt = Date.now();
        }
        return ok;
      })
      .catch(() => false)
      .finally(() => {
        verifyRequestPromise = null;
      });
  }

  return verifyRequestPromise;
};

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      const token = localStorage.getItem("token");

      // Jika tidak ada token, langsung redirect ke login
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const isValid = await verifyTokenWithCache();

        if (isValid) {
          if (isMounted) {
            setIsAuthenticated(true);
          }
        } else {
          // Token tidak valid atau expired
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (isMounted) {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Token verification error:", error);
        // Token invalid atau expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
