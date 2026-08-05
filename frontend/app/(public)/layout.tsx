import type { ReactNode } from "react";

import { PublicNavbarServer } from "@/components/shared/public-navbar-server";

export default function PublicLayout({ children, modal, drawer }: { children: ReactNode; modal?: ReactNode; drawer?: ReactNode }) {
  return (
    <>
      <PublicNavbarServer />
      {children}
      {modal ?? null}
      {drawer ?? null}
    </>
  );
}
