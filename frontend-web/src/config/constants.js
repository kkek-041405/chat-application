export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://chat-application-kxio.onrender.com";

export const ROOMS = [
    { id: "general", name: "General", desc: "Global general chat for everyone" },
    { id: "random", name: "Random", desc: "Random thoughts, memes, and jokes" },
    { id: "tech", name: "Tech Talk", desc: "Programming, gadgets, and system designs" },
    { id: "gaming", name: "Gaming", desc: "Co-op gaming, strategies, and reviews" }
];
