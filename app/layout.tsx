import type { Metadata } from "next";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "南大研支团活动协同平台",
  description: "南京大学研究生支教团跨校活动日历与状态追踪平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        {/* 移动端保留顶部导航(侧栏 md 以下隐藏),桌面端改用侧栏 */}
        <div className="md:hidden">
          <SiteHeader />
        </div>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}