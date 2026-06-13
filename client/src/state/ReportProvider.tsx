import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ReportContext } from "./ReportContenxt";
import ReportDialog from "../components/ReportDialog";

type Props = {
    children: ReactNode;
}

const ReportProvider = ({children}:Props) => {
    const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
    const [open, setOpen] = useState<boolean>(false)
    const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

    useEffect(() => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) return;

        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.key === "r" && e.ctrlKey) {
                e.preventDefault();

                if (hoveredComponent){
                    setSelectedComponent(hoveredComponent)
                    setOpen(true);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {window.removeEventListener("keydown", handleKeyDown);
        }
    }, [hoveredComponent]);

    const value = useMemo(() => ({
        hoveredComponent,
        setHoveredComponent,
    }), [hoveredComponent]);

  return (
    <ReportContext.Provider value={value}>
        {children}
        <ReportDialog 
            open={open} 
            componentName={selectedComponent || ""} 
            onClose={() => {
                setOpen(false);
                setSelectedComponent(null);
            }}
        />
    </ReportContext.Provider>
  )
}

export default ReportProvider