// @ts-nocheck
import { useEffect, useState } from "react";

const getPreferredDarkMode = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const useDarkMode = () => {
  const [dark, setDark] = useState(getPreferredDarkMode);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event) => setDark(event.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }

    if (typeof media.addListener === "function") {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }

    return undefined;
  }, []);

  return dark;
};
