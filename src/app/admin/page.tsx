import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminPageClient from "./admin-page";

const ADMIN_ROLE = "admin";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = (user?.publicMetadata as Record<string, unknown> | undefined)?.role;

  const safeUser = {
    email: user?.emailAddresses?.[0]?.emailAddress ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    role: (role as string) ?? "",
  };

  return <AdminPageClient user={safeUser} />;
}