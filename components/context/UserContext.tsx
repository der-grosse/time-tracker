"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { decodeToken } from "react-jwt";

interface UserContextType {
  user: JWTPayload | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{
  children: React.ReactNode;
  jwt?: string;
}> = ({ children, jwt }) => {
  const [user, setUser] = useState<JWTPayload | null>(jwt ? decodeToken(jwt) : null);

  useEffect(() => {
    if (jwt) {
      const decoded = decodeToken(jwt) as JWTPayload;
      setUser(decoded);
    } else {
      setUser(null);
    }
  }, [jwt]);

  return <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
