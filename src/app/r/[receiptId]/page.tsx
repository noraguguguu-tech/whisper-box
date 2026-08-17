import { use } from "react";
import { ReceiptView } from "@/components/whisper/receipt-view";

export default function ReceiptPage({
  params,
}: {
  params: Promise<{ receiptId: string }>;
}) {
  const { receiptId } = use(params);
  return <ReceiptView receiptId={receiptId} />;
}
