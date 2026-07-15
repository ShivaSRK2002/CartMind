import { redirect } from "next/navigation";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { getUserProfile } from "@/lib/orders";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export default async function CheckoutPage() {
  const session = await getSession();
  const token = await getSessionToken();

  if (!session || !token) {
    redirect("/login?returnUrl=/checkout");
  }

  const user = await getUserProfile(token);

  return <CheckoutForm userName={user.name} userEmail={user.email} />;
}
