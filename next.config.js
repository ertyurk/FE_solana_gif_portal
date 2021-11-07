/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  images: {
    domains: ['media.giphy.com','i.giphy.com', 'media3.giphy.com', 'media4.giphy.com'],
  },
  // This is the fix
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };

    return config;
  },
};