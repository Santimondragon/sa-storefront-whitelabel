import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex w-full justify-center py-10">
      <SignIn routing="path" />
    </div>
  );
}
