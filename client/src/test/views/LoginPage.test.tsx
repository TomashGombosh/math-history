import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CognitoAuthError } from "../../lib/cognito-auth";
import { ROUTES } from "../../router/paths";
import LoginPage from "../../views/LoginPage";

const mockNavigate = vi.hoisted(() => vi.fn());

const mockAuth = vi.hoisted(() => ({
  isAuthed: false,
  authReady: true,
  loginWithEmailPassword: vi.fn(),
  confirmNewPassword: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../state/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

function credEmail() {
  return screen.getByRole("textbox", { name: /Електронна пошта/ });
}

/** happy-dom does not always map `type="password"` to `role="textbox"`; `name` is stable on our form. */
function inputByName(name: string) {
  const el = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!el) {
    throw new Error(`Missing input[name="${name}"]`);
  }
  return el;
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isAuthed = false;
    mockAuth.authReady = true;
    mockAuth.loginWithEmailPassword.mockReset();
    mockAuth.confirmNewPassword.mockReset();
    mockAuth.logout.mockResolvedValue(undefined);
    vi.stubEnv("VITE_COGNITO_USER_POOL_ID", "eu-west-1_testpool");
    vi.stubEnv("VITE_COGNITO_USER_POOL_CLIENT_ID", "testclientid");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should warn when Cognito env is not configured", () => {
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_COGNITO_USER_POOL_ID", "");
    vi.stubEnv("VITE_COGNITO_USER_POOL_CLIENT_ID", "");
    render(<LoginPage />);
    expect(screen.getByText(/Cognito не налаштовано/)).toBeInTheDocument();
  });

  it("should show an error when sign-in fails", async () => {
    const user = userEvent.setup();
    mockAuth.loginWithEmailPassword.mockRejectedValue(
      new CognitoAuthError("Невірна пошта або пароль.", "INVALID_CREDENTIALS")
    );
    render(<LoginPage />);
    await user.type(credEmail(), "a@b.com");
    await user.type(inputByName("password"), "secret");
    await user.click(screen.getByRole("button", { name: "Увійти" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Невірна пошта або пароль.");
  });

  it("should navigate to admin when sign-in completes", async () => {
    const user = userEvent.setup();
    mockAuth.loginWithEmailPassword.mockResolvedValue({ status: "signed_in" });
    render(<LoginPage />);
    await user.type(credEmail(), "admin@test.com");
    await user.type(inputByName("password"), "secret");
    await user.click(screen.getByRole("button", { name: "Увійти" }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.admin);
    });
  });

  it("should show the new-password step when Cognito requires it", async () => {
    const user = userEvent.setup();
    mockAuth.loginWithEmailPassword.mockResolvedValue({
      status: "new_password_required",
      missingAttributes: ["email"],
    });
    render(<LoginPage />);
    await user.type(credEmail(), "admin@test.com");
    await user.type(inputByName("password"), "temp");
    await user.click(screen.getByRole("button", { name: "Увійти" }));
    expect(await screen.findByRole("heading", { name: "Новий пароль" })).toBeInTheDocument();
    expect(inputByName("newPassword")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox", { name: /Електронна пошта/ })[0]).toBeInTheDocument();
  });

  it("should show a message when new passwords do not match", async () => {
    const user = userEvent.setup();
    mockAuth.loginWithEmailPassword.mockResolvedValue({
      status: "new_password_required",
      missingAttributes: [],
    });
    render(<LoginPage />);
    await user.type(credEmail(), "admin@test.com");
    await user.type(inputByName("password"), "temp");
    await user.click(screen.getByRole("button", { name: "Увійти" }));
    await screen.findByRole("heading", { name: "Новий пароль" });
    await user.type(inputByName("newPassword"), "NewSecret1!");
    await user.type(inputByName("confirmNewPassword"), "Different1!");
    await user.click(screen.getByRole("button", { name: "Зберегти пароль і увійти" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Паролі не збігаються.");
    expect(mockAuth.confirmNewPassword).not.toHaveBeenCalled();
  });

  it("should submit new password and navigate to admin", async () => {
    const user = userEvent.setup();
    mockAuth.loginWithEmailPassword.mockResolvedValue({
      status: "new_password_required",
      missingAttributes: [],
    });
    mockAuth.confirmNewPassword.mockResolvedValue(undefined);
    render(<LoginPage />);
    await user.type(credEmail(), "admin@test.com");
    await user.type(inputByName("password"), "temp");
    await user.click(screen.getByRole("button", { name: "Увійти" }));
    await screen.findByRole("heading", { name: "Новий пароль" });
    await user.type(inputByName("newPassword"), "NewSecret1!");
    await user.type(inputByName("confirmNewPassword"), "NewSecret1!");
    await user.click(screen.getByRole("button", { name: "Зберегти пароль і увійти" }));
    await waitFor(() => {
      expect(mockAuth.confirmNewPassword).toHaveBeenCalledWith("NewSecret1!", undefined);
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.admin);
    });
  });

  it("should cancel new-password flow and sign out", async () => {
    const user = userEvent.setup();
    mockAuth.loginWithEmailPassword.mockResolvedValue({
      status: "new_password_required",
      missingAttributes: [],
    });
    render(<LoginPage />);
    await user.type(credEmail(), "admin@test.com");
    await user.type(inputByName("password"), "temp");
    await user.click(screen.getByRole("button", { name: "Увійти" }));
    await screen.findByRole("heading", { name: "Новий пароль" });
    await user.click(screen.getByRole("button", { name: "Скасувати" }));
    await waitFor(() => {
      expect(mockAuth.logout).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { name: "Вхід в адмін-панель" })).toBeInTheDocument();
  });
});
