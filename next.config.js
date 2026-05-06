/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse usa fs/path em runtime — precisa estar nos external packages do server
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  // Aumenta limite de body para uploads de PDF (default é 1MB)
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
