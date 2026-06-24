import type { ReactNode } from "react";
import { useReport } from "../state/ReportContenxt";

type ReportableProps = {
    children: ReactNode;
    component:{
      type: "teacher" | "graduate" | "page" | "other";
      id?: string;
      label:string;
      url?: string;

    };
}

const Reportable = ({ children, component }: ReportableProps) => {

    const {setHoveredComponent} = useReport();
  return (
    <div
      onMouseEnter={() => setHoveredComponent(component)}
      onMouseLeave={() => setHoveredComponent(null)}
    >
      {children}
    </div>
  )
}

export default Reportable