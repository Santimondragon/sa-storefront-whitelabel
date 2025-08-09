import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { api } from "~/trpc/server";

const ADMIN_ROLE = "admin";

export default async function AdminPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
    const user = await currentUser();
    const hasRole = user?.publicMetadata?.role === ADMIN_ROLE;
    if (!hasRole) redirect("/");

    const products = await api.product.getAll({ first: 10 });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Admin</h1>
            <div className="text-sm text-muted-foreground">Signed in as {user?.emailAddresses?.[0]?.emailAddress}</div>
            <div className="grid grid-cols-1 gap-2">
                {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded border p-3">
                        <div>
                            <div className="font-medium">{p.title}</div>
                            <div className="text-xs text-muted-foreground">/{p.handle}</div>
                        </div>
                        <button className="text-sm text-primary" disabled>
                            Create (Admin API) — not implemented
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
