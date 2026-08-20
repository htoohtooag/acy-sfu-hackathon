import type { ReactNode } from "react";

import { PublicFooter } from "@/components/features/public-home/public-footer";
import { PublicNavbarServer } from "@/components/shared/public-navbar-server";

export default function PublicLayout({ children, modal, drawer }: { children: ReactNode; modal?: ReactNode; drawer?: ReactNode }) {
  return (
    <>
      <PublicNavbarServer />
      {children}
      <PublicFooter />
      {modal ?? null}
      {drawer ?? null}
    </>
  );
}
