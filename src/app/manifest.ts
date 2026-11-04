import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TaskFlow",
    short_name: "TaskFlow",
    description: "Workspace modern untuk mengelola proyek, tugas, tim, dan produktivitas.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#090c18",
    theme_color: "#090c18",
    icons: [{ src: "/brand/mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
