import Cookies from "js-cookie";

export const isAuthenticated = () => {
  return typeof window !== "undefined" && Cookies.get("token") !== undefined;
};

export const logout = () => {
  Cookies.remove("token");
};
    