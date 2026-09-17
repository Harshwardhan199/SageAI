export const config = {
    GOOGLE_CLIENT_ID: import.meta.env.VITE_REACT_APP_GOOGLE_CLIENT_ID || "199572740246-vlla3ohc2vm4ukf621cahnv0ek805u1n.apps.googleusercontent.com",
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL !== undefined
        ? import.meta.env.VITE_BACKEND_URL
        : (import.meta.env.DEV ? "http://localhost:5000" : "")
};
