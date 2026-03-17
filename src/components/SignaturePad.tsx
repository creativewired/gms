"use client";

import { useRef, useEffect, useState } from "react";

type Props = {
  jobId: number;
  existingSignature?: string | null;
  signedAt?: string | null;
  signedBy?: string | null;
  onSigned?: () => void;
};

export default function SignaturePad({
  jobId,
  existingSignature,
  signedAt,
  signedBy,
  onSigned,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [showPad, setShowPad] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!showPad) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1c1c1e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [showPad]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(true);
    setIsEmpty(false);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    setDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    setSaving(true);
    setError("");

    const signatureData = canvas.toDataURL("image/png");

    const res = await fetch("/api/jobs/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, signatureData, signedBy: name || "Customer" }),
    });

    const data = await res.json();
    setSaving(false);

    if (data.error) {
      setError(data.error);
    } else {
      setSaved(true);
      setShowPad(false);
      onSigned?.();
    }
  };

  // ── Already signed ─────────────────────────────────────────────
  if (existingSignature && !showPad) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "#f0fdf4" }}>
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor"
                strokeWidth={2.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-800">Customer Signature</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
              Signed
            </span>
            <button
              onClick={() => setShowPad(true)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Re-sign
            </button>
          </div>
        </div>

        {/* Signature image */}
        <div className="rounded-xl overflow-hidden border border-slate-100"
          style={{ background: "#fafafa" }}>
          <img
            src={existingSignature}
            alt="Customer signature"
            className="w-full"
            style={{ maxHeight: "140px", objectFit: "contain" }}
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-slate-400">
            Signed by <span className="font-semibold text-slate-600">{signedBy ?? "Customer"}</span>
          </p>
          {signedAt && (
            <p className="text-xs text-slate-400">
              {new Date(signedAt).toLocaleDateString("en-AE", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Not yet signed ─────────────────────────────────────────────
  if (!showPad) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "#f5f3ff" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="#7c3aed" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-800">Customer Signature</p>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Collect the customer's signature to authorize the job and confirm acceptance of the work order.
        </p>
        <button
          onClick={() => setShowPad(true)}
          className="btn-primary w-full justify-center"
          style={{ background: "#7c3aed" }}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
          Collect Signature
        </button>
      </div>
    );
  }

  // ── Signature pad ──────────────────────────────────────────────
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "#f5f3ff" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="#7c3aed" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-800">Customer Signature</p>
        </div>
        <button onClick={() => setShowPad(false)}
          className="btn-ghost text-xl leading-none">×</button>
      </div>

      {/* Signer name */}
      <div className="mb-4">
        <label className="label">Signer Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Customer name..."
          className="input"
        />
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden mb-3"
        style={{ border: "2px dashed #e2e8f0", background: "#fafafa" }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full touch-none"
          style={{ cursor: "crosshair", display: "block" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-300 text-sm select-none">Sign here...</p>
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-400 text-center mb-4">
        Use mouse or touch to sign above
      </p>

      {error && (
        <p className="text-xs text-red-500 mb-3">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || isEmpty}
          className="btn-primary flex-1 justify-center"
          style={{ background: "#7c3aed" }}
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Save Signature
            </>
          )}
        </button>
        <button
          onClick={clearCanvas}
          className="btn-ghost"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
