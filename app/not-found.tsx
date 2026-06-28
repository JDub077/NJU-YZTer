import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="text-sm text-muted-foreground">
        页面不存在或活动已被删除。
      </p>
      <Button asChild>
        <Link href="/">返回日历</Link>
      </Button>
    </div>
  );
}