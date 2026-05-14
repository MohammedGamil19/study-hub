import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const ADMIN_EMAIL = "mohamadshogaa7712@gmail.com";

export const metadata = {
  title: "Admin — StudyHub",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    redirect("/login");
  }
  return <>{children}</>;
}
