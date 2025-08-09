import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex w-full justify-center py-10">
      <SignUp routing="path" />
    </div>
  );
}
