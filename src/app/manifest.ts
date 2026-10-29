import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ten-Minute Mentor",
    short_name: "Mentor",
    description: "Faculty mentoring, follow-ups and student support tracking.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
