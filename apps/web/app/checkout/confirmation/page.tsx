import { redirect } from "next/navigation";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { getOrderById } from "@/lib/orders";
import { OrderConfirmationView } from "@/components/checkout/OrderConfirmationView";

interface ConfirmationPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function OrderConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const session = await getSession();
  const token = await getSessionToken();
  const { orderId } = await searchParams;

  if (!session || !token) {
    redirect("/login?returnUrl=/checkout");
  }

  if (!orderId) {
    redirect("/account/orders");
  }

  let order;
  try {
    order = await getOrderById(token, orderId);
  } catch {
    redirect("/account/orders");
  }

  return <OrderConfirmationView order={order} userName={session.name} />;
}
