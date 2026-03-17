"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-slate-900 text-white text-sm px-5 py-2 rounded-md hover:bg-slate-700 transition"
    >
      🖨️ Print / Save as PDF
    </button>
  );
}
