import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LightboxGallery } from "../../components/LightboxGallery";
import type { GraduateCohortImage } from "../../lib/apiTypes";

describe("LightboxGallery", () => {
  const images: GraduateCohortImage[] = [
    { url: "/images/graduates/a.png", caption: "First", specialty: "Математика" },
    { url: "/images/graduates/b.png", caption: "Second", specialty: "Математика" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show the image at startIndex after remount (e.g. parent key bump)", () => {
    const { rerender } = render(
      <LightboxGallery key="a" open onClose={() => {}} images={images} startIndex={0} />,
    );
    expect(screen.getByRole("img", { name: "First" })).toBeInTheDocument();

    rerender(<LightboxGallery key="b" open onClose={() => {}} images={images} startIndex={1} />);
    expect(screen.getByRole("img", { name: "Second" })).toBeInTheDocument();
  });

  it("should go to next image on ArrowRight", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<LightboxGallery open onClose={onClose} images={images} startIndex={0} />);

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("img", { name: "Second" })).toBeInTheDocument();
  });

  it("should call onClose on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<LightboxGallery open onClose={onClose} images={images} startIndex={0} />);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
