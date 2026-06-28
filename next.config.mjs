/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出 —— GitHub Pages 只支持静态文件
  output: 'export',
  // 部署在 GitHub Pages 子路径 https://<user>.github.io/NJU-YZTer/
  basePath: '/NJU-YZTer',
  trailingSlash: true,
  // 静态导出不支持图片优化
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;