import type { Metadata } from "next";
import { AdminClient } from "./AdminClient";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard — manage users, moderate content, and view platform stats.",
  openGraph: {
    title: "Admin Dashboard | GetWired.dev",
    description: "Admin dashboard — manage users, moderate content, and view platform stats.",
  },
};

export default function AdminPage() {
  return <AdminClient />;
}

