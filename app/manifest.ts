import type { MetadataRoute } from "next";

// The web app manifest, so the site can be added to a phone's home screen and
// open full screen. Navy to match the header and the logo. The icons are
// public/icons/, made from public/logo.png; the iPhone's is app/apple-icon.png.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Faithful Path Community",
    short_name: "Faithful Path",
    description: "Pastoral guidance for the next faithful step.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#1f2d45",
    background_color: "#1f2d45",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
