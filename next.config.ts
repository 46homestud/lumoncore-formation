import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le PDF maître (dossier private/, hors public) doit être embarqué dans la fonction de téléchargement
  outputFileTracingIncludes: {
    "/api/download": ["./private/**/*"],
  },
};

export default nextConfig;
