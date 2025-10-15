/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Handle JSON imports
    config.module.rules.push({
      test: /\.geojson$/,
      use: ['json-loader']
    });
    return config;
  }
}

export default nextConfig;
