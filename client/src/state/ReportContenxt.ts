import { useContext, createContext } from "react";

type ReportContextValue = {
  hoveredComponent: string | null;
  setHoveredComponent: (value: string | null) => void;
};

export const ReportContext = createContext<ReportContextValue | null>(null);

export const useReport = () => {
  const context = useContext(ReportContext);

  if (!context) {
    throw new Error("useReport must be used inside ReportProvider");
  }

  return context;
};

