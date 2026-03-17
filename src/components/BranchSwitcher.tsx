"use client";

import { useState } from "react";
import { useBranch } from "@/context/BranchContext";

type Branch = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
};

export default function BranchSwitcher({ branches }: { branches: Branch[] }) {
  const { currentBranch, setCurrentBranch, isAllBranches } = useBranch();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Branch icon */}
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: isAllBranches ? "rgba(124,58,237,0.3)" : "rgba(34,197,94,0.2)" }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}
            viewBox="0 0 24 24"
            style={{ color: isAllBranches ? "#a78bfa" : "#4ade80" }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        <div className="flex-1 text-left min-w-0">
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.2 }} className="truncate">
            {isAllBranches ? "All Branches" : currentBranch?.name}
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", lineHeight: 1.2 }} className="truncate">
            {isAllBranches ? `${branches.length} locations` : "Active branch"}
          </p>
        </div>

        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}
          viewBox="0 0 24 24" style={{ color: "rgba(255,255,255,0.3)" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute left-0 right-0 z-50 rounded-xl overflow-hidden"
            style={{
              top: "calc(100% + 6px)",
              background: "rgba(28,28,30,0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            }}
          >
            {/* All Branches option */}
            <button
              onClick={() => { setCurrentBranch(null); setOpen(false); window.location.reload(); }}
              className="w-full flex items-center gap-3 px-4 py-3 transition-all"
              style={{
                background: isAllBranches ? "rgba(124,58,237,0.15)" : "transparent",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(124,58,237,0.2)" }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="#a78bfa" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>
              <div className="text-left">
                <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.78rem", fontWeight: 600 }}>
                  All Branches
                </p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>
                  View combined data
                </p>
              </div>
              {isAllBranches && (
                <svg className="w-4 h-4 ml-auto" fill="none" stroke="#a78bfa" strokeWidth={2.5} viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* Individual branches */}
            {branches.map((branch) => {
              const isSelected = currentBranch?.id === branch.id;
              return (
                <button
                  key={branch.id}
                  onClick={() => { setCurrentBranch(branch); setOpen(false); window.location.reload(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-all"
                  style={{
                    background: isSelected ? "rgba(34,197,94,0.1)" : "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.06)" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem", fontWeight: 700 }}>
                      {branch.name.charAt(0)}
                    </span>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.78rem", fontWeight: 600 }} className="truncate">
                      {branch.name}
                    </p>
                    {branch.address && (
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.62rem" }} className="truncate">
                        {branch.address}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 ml-auto shrink-0" fill="none" stroke="#4ade80" strokeWidth={2.5} viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
