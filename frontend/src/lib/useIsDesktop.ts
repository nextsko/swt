import { useEffect, useState } from "react";

/**
 * useIsDesktop - 响应式检测当前视窗是否为桌面尺寸 (>= 768px)
 * 用于双栏/单栏布局切换
 */
export function useIsDesktop(breakpoint = 768): boolean {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= breakpoint : true,
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isDesktop;
}
