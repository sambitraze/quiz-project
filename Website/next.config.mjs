/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    experimental: {
        serverComponentsExternalPackages: [],
    },
    async redirects() {
        return [
            {
                source: '/:path*',
                has: [{ type: 'host', value: 'www.naadanaad.com' }],
                destination: 'https://naadanaad.com/:path*',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;