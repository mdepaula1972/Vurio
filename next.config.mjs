/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse']
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Vurio-Version', value: 'v1.2.0' },
          { key: 'X-Vurio-Engine', value: 'Vurio Compliance & Forensic Engine v1.2.0' }
        ]
      }
    ];
  }
};

export default nextConfig;
