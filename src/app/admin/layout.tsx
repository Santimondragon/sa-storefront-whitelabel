import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const user = await currentUser();
    const role = (user?.publicMetadata as Record<string, unknown> | undefined)?.role;
    //   if (role !== "admin") redirect("/");

    return <>{children}</>;
}
