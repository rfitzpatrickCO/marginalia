/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this project (a stray lockfile lives in $HOME).
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
