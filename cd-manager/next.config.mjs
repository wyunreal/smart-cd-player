/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
        port: "",
        pathname: "/image/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "i.discogs.com",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
  },
};
export default nextConfig;
