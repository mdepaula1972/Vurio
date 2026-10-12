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
          { key: 'X-Vurio-Version', value: 'v1.4.0' },
          { key: 'X-Vurio-Engine', value: 'Vurio DP Workstation v1.4.0' }
        ]
      }
    ];
  }
};

export default nextConfig;
