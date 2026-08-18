import { use } from "react";
import { WallView } from "@/components/whisper/wall-view";

export default function WallPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <WallView slug={slug} />;
}
