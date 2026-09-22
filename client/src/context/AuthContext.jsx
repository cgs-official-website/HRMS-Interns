import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  onAuthUserChanged,
  getDbType,
  sendPasswordReset,
  confirmPasswordReset,
  changeUserPassword
} from "../firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbMode, setDbMode] = useState(getDbType());

  useEffect(() => {
    // Listen to authentication status change
    const unsubscribe = onAuthUserChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
      setDbMode(getDbType());
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const signup = async (name, department, programType, email, password, shiftStart, shiftEnd, employeeId = "", companySlug = "") => {
    setLoading(true);
    try {
      await registerUser(name, department, programType, email, password, shiftStart, shiftEnd, 25, 10, 6, "", "", "", [], "Full-time", "", false, employeeId, companySlug);
      const user = await loginUser(email, password);
      setCurrentUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      setCurrentUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentUserState = (newData) => {
    setCurrentUser(prev => prev ? { ...prev, ...newData } : null);
  };

  const value = {
    currentUser,
    loading,
    dbMode,
    signup,
    login,
    logout,
    updateCurrentUserState,
    sendPasswordReset,
    confirmPasswordReset,
    changeUserPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
