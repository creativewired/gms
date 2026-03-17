"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Branch = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
};

type BranchContextType = {
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch | null) => void;
  isAllBranches: boolean;
};

const BranchContext = createContext<BranchContextType>({
  currentBranch: null,
  setCurrentBranch: () => {},
  isAllBranches: true,
});

export function BranchProvider({
  children,
  branches,
}: {
  children: React.ReactNode;
  branches: Branch[];
}) {
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("workshopos_branch");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const found = branches.find((b) => b.id === parsed.id);
        if (found) setCurrentBranchState(found);
      } catch {}
    }
  }, [branches]);

  const setCurrentBranch = (branch: Branch | null) => {
    setCurrentBranchState(branch);
    if (branch) {
      localStorage.setItem("workshopos_branch", JSON.stringify(branch));
    } else {
      localStorage.removeItem("workshopos_branch");
    }
  };

  return (
    <BranchContext.Provider
      value={{
        currentBranch,
        setCurrentBranch,
        isAllBranches: currentBranch === null,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);
