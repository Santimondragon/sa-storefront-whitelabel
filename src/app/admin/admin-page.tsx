"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const AdminForm = dynamic(() => import("~/components/AdminForm"), {
  ssr: false,
});
const LandingPageEditor = dynamic(
  () => import("~/components/LandingPageEditor"),
  { ssr: false }
);
const PreviewPane = dynamic(() => import("~/components/PreviewPane"), {
  ssr: false,
});

export default function AdminPage({
  user,
}: {
  user: { email: string; firstName: string; lastName: string; role: string };
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Content Admin</h1>
      <div className="text-sm text-muted-foreground">
        Signed in as {user.email}
      </div>
      <div>
        <Link
          href="/admin/pages"
          className="inline-block bg-black text-white px-4 py-2 rounded"
        >
          Manage Pages
        </Link>
      </div>
    </div>
  );
}