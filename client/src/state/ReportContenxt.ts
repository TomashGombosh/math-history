import { useContext, createContext } from "react";

export type ReportComponent = {
  type: "teacher" | "graduate" | "page" | "other";
  id?: string;
  label: string;
  url?: string;
};

type ReportContextValue = {
  hoveredComponent: ReportComponent | null;
  setHoveredComponent: (value: ReportComponent | null) => void;
};

export const ReportContext = createContext<ReportContextValue | null>(null);

export const useReport = () => {
  const context = useContext(ReportContext);

  if (!context) {
    throw new Error("useReport must be used inside ReportProvider");
  }

  return context;
};

