import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import ReportProvider from "../../state/ReportProvider";
import { useContext } from "react";
import { ReportContext } from "../../state/ReportContenxt";

type ReportDialogProps = {
  open: boolean;
  componentName: string;
  onClose: () => void;
};

const mockDialog = vi.fn();

vi.mock("../../components/ReportDialog", () => ({
  default: (props: ReportDialogProps) => {
    mockDialog(props);

    return props.open ? (
      <div>
        <span>Dialog Open</span>
        <span>{props.componentName}</span>
        <button onClick={props.onClose}>Close</button>
      </div>
    ) : null;
  },
}));

function TestComponent() {
  const context = useContext(ReportContext);

  return (
    <div>
      <span>Child Component</span>

      <button
        onMouseEnter={() =>
          context?.setHoveredComponent("TestComponent")
        }
      >
        Hover Me
      </button>
    </div>
  );
}

describe("ReportProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children", () => {
    render(
      <ReportProvider>
        <span>Test Child</span>
      </ReportProvider>
    );

    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("should not open dialog when no component is hovered", () => {
    render(
      <ReportProvider>
        <TestComponent />
      </ReportProvider>
    );

    fireEvent.keyDown(window, {
      key: "r",
      ctrlKey: true,
    });

    expect(screen.queryByText("Dialog Open")).not.toBeInTheDocument();
  });

  it("should open dialog on Ctrl + R when component is hovered", () => {
    render(
      <ReportProvider>
        <TestComponent />
      </ReportProvider>
    );

    fireEvent.mouseEnter(screen.getByText("Hover Me"));

    fireEvent.keyDown(window, {
      key: "r",
      ctrlKey: true,
    });

    expect(screen.getByText("Dialog Open")).toBeInTheDocument();
    expect(screen.getByText("TestComponent")).toBeInTheDocument();
  });

  it("should close dialog when onClose is called", () => {
    render(
      <ReportProvider>
        <TestComponent />
      </ReportProvider>
    );

    fireEvent.mouseEnter(screen.getByText("Hover Me"));

    fireEvent.keyDown(window, {
      key: "r",
      ctrlKey: true,
    });

    expect(screen.getByText("Dialog Open")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close"));

    expect(screen.queryByText("Dialog Open")).not.toBeInTheDocument();
  });
});