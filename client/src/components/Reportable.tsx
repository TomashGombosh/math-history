import type { ReactNode } from "react";
import { useReport } from "../state/ReportContenxt";

type ReportableProps = {
    children: ReactNode;
    componentName: string;
}

const Reportable = ({ children, componentName }: ReportableProps) => {

    const {setHoveredComponent} = useReport();
  return (
    <div
      onMouseEnter={() => setHoveredComponent(componentName)}
      onMouseLeave={() => setHoveredComponent(null)}
    >
      {children}
    </div>
  )
}

export default Reportable