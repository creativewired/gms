"use client";

import { useRouter } from "next/navigation";
import InspectionChecklist from "@/components/InspectionChecklist";

type Props = {
  jobId: number;
  existing?: any;
};

export default function InspectionSection({ jobId, existing }: Props) {
  const router = useRouter();
  return (
    <InspectionChecklist
      jobId={jobId}
      existing={existing}
      onSaved={() => router.refresh()}
    />
  );
}
