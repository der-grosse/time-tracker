"use client";

import { useEffect, useState } from "react";

export const useNow = () => {
  const [now, setNow] = useState(() => Date.now());

  // Tick every second so the running timer and totals stay live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
};
