"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentButton({
  jobId,
  existingLink,
  paymentStatus,
  totalAmount,
}: {
  jobId: number;
  existingLink: string | null;
  paymentStatus: string;
  totalAmount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      const data = await res.json();

      if (data.error) {
        alert("Error: " + data.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert("Something went wrong!");
    }
    setLoading(false);
  };

  const handleSendWhatsApp = () => {
    if (!existingLink) return;
    const msg = encodeURIComponent(
      `Hello! Here is your payment link for your recent workshop service:\n\n${existingLink}\n\nAmount: AED ${totalAmount.toFixed(2)}\n\nThank you!`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleOpenLink = () => {
    if (existingLink) window.open(existingLink, "_blank");
  };

  if (paymentStatus === "paid") return null;

  return (
    <div className="space-y-2">
      {!existingLink ? (
        <button
          onClick={handleGenerateLink}
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Generate Payment Link
            </>
          )}
        </button>
      ) : (
        <>
          <button
            onClick={handleOpenLink}
            className="btn-primary w-full justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open Payment Link
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "#f0fdf4",
              color: "#15803d",
              border: "1.5px solid #bbf7d0",
            }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Send via WhatsApp
          </button>

          <button
            onClick={handleGenerateLink}
            disabled={loading}
            className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
          >
            {loading ? "Regenerating..." : "↺ Regenerate link"}
          </button>
        </>
      )}
    </div>
  );
}
