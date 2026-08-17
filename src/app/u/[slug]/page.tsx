import { use } from "react";
import { VisitorView } from "@/components/whisper/visitor-view";

export default function VisitorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <VisitorView slug={slug} />;
}
