"use client";

import { useSetTabInfo } from "@/components/hooks/setTabInfo";

export default function TabTitleLayout(props: Readonly<{ children: React.ReactNode }>) {
  useSetTabInfo();
  return props.children;
}
