"use client";

import { useRouter } from "next/navigation";
import PromptBuilderTool from "@/components/PromptBuilderTool";

export default function PromptBuilderHomepageWrap() {
  const router = useRouter();

  const handleQ1Complete = (jobTitle: string) => {
    router.push(`/prompt-builder?jobTitle=${encodeURIComponent(jobTitle)}`);
  };

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      <div className="pb-frame hero-tool-dark">
        <span className="pb-frame-label">AGENT: Prompt Builder</span>
        <div className="pb-frame-body">
          <PromptBuilderTool onQ1Complete={handleQ1Complete} hideFileUpload showDeliverables />
        </div>
      </div>
    </div>
  );
}
