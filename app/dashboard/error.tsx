"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[dashboard error]", error);
  }, [error]);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">仪表盘加载出错</h1>
      <p className="text-sm text-muted-foreground">
        请截图把下面的错误信息发给开发者。
      </p>
      <pre className="max-h-40 w-full overflow-auto rounded-md bg-muted px-3 py-2 text-left text-xs">
        {error.message}
      </pre>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          <RefreshCw className="mr-1 h-4 w-4" />
          重试
        </Button>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回日历
          </Link>
        </Button>
      </div>
    </div>
  );
}