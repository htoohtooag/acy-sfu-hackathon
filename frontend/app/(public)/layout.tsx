import type { ReactNode } from "react";

import { PublicNavbar } from "@/components/shared/public-navbar";

export default function PublicLayout({ children, modal, drawer }: { children: ReactNode; modal?: ReactNode; drawer?: ReactNode }) {
  return (
    <>
      <PublicNavbar />
      {children}
      {modal ?? null}
      {drawer ?? null}
    </>
  );
}
