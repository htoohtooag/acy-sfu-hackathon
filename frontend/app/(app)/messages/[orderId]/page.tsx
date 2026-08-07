import { WorkroomInbox } from "@/components/features/workroom/workroom-inbox";

interface MessagesOrderPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function MessagesOrderPage({ params }: MessagesOrderPageProps): Promise<React.ReactNode> {
  const { orderId } = await params;
  return <WorkroomInbox initialOrderId={orderId} />;
}
