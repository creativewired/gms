"use client";

import { useRouter } from "next/navigation";
import SignaturePad from "@/components/SignaturePad";

type Props = {
  jobId: number;
  existingSignature?: string | null;
  signedAt?: string | null;
  signedBy?: string | null;
};

export default function SignatureSection({ jobId, existingSignature, signedAt, signedBy }: Props) {
  const router = useRouter();
  return (
    <SignaturePad
      jobId={jobId}
      existingSignature={existingSignature}
      signedAt={signedAt}
      signedBy={signedBy}
      onSigned={() => router.refresh()}
    />
  );
}
