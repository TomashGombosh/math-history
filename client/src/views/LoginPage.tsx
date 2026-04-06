import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CognitoAuthError } from "../lib/cognito-auth";
import { isCognitoConfigured } from "../lib/cognito-config";
import { ROUTES } from "../router/paths";
import { useAuth } from "../state/AuthContext";

const ATTR_LABELS: Record<string, string> = {
  email: "Електронна пошта",
  phone_number: "Телефон",
  name: "Повне ім'я",
  given_name: "Ім'я",
  family_name: "Прізвище",
  preferred_username: "Ім'я користувача",
};

function labelForAttribute(key: string): string {
  return ATTR_LABELS[key] ?? key;
}

type Phase = "credentials" | "new_password";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [extraAttrs, setExtraAttrs] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("credentials");
  const [missingAttributes, setMissingAttributes] = useState<string[] | undefined>();
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { loginWithEmailPassword, confirmNewPassword: submitNewPassword, logout, isAuthed, authReady } =
    useAuth();

  useEffect(() => {
    if (authReady && isAuthed) {
      navigate(ROUTES.admin);
    }
  }, [isAuthed, authReady, navigate]);

  const configured = isCognitoConfigured();

  const resetToCredentials = async () => {
    setErrorMessage("");
    setNewPassword("");
    setConfirmNewPassword("");
    setExtraAttrs({});
    setMissingAttributes(undefined);
    setPhase("credentials");
    await logout();
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={2} sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography component="h1" variant="h5" gutterBottom>
          {phase === "credentials" ? "Вхід в адмін-панель" : "Новий пароль"}
        </Typography>
        {phase === "new_password" ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Обліковий запис потребує постійного пароля. Введіть новий пароль для продовження.
          </Typography>
        ) : null}
        {!configured ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cognito не налаштовано. Додайте у <code>.env</code>:{" "}
            <code>VITE_COGNITO_USER_POOL_ID</code>, <code>VITE_COGNITO_USER_POOL_CLIENT_ID</code> (регіон
            береться з pool id). Пул має використовувати email як username; обліковий запис має бути у групі{" "}
            <code>admin</code>.
          </Alert>
        ) : null}
        {phase === "credentials" ? (
          <Box
            component="form"
            onSubmit={async (e) => {
              e.preventDefault();
              setPending(true);
              setErrorMessage("");
              try {
                const result = await loginWithEmailPassword(email, password);
                if (result.status === "signed_in") {
                  navigate(ROUTES.admin);
                  return;
                }
                setMissingAttributes(result.missingAttributes);
                setExtraAttrs({});
                setPhase("new_password");
              } catch (err) {
                const msg =
                  err instanceof CognitoAuthError ? err.message : "Помилка авторизації";
                setErrorMessage(msg);
              } finally {
                setPending(false);
              }
            }}
          >
            <TextField
              fullWidth
              required
              margin="normal"
              label="Електронна пошта"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!configured || pending}
            />
            <TextField
              fullWidth
              required
              margin="normal"
              label="Пароль"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!configured || pending}
            />
            {errorMessage ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Alert>
            ) : null}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={!configured || pending}
            >
              {pending ? "Вхід…" : "Увійти"}
            </Button>
          </Box>
        ) : (
          <Box
            component="form"
            onSubmit={async (e) => {
              e.preventDefault();
              setErrorMessage("");
              if (newPassword !== confirmNewPassword) {
                setErrorMessage("Паролі не збігаються.");
                return;
              }
              const required = missingAttributes ?? [];
              const userAttributes: Record<string, string> = {};
              for (const key of required) {
                const raw = extraAttrs[key] ?? (key === "email" ? email.trim() : "");
                if (!raw) {
                  setErrorMessage(`Заповніть поле: ${labelForAttribute(key)}`);
                  return;
                }
                userAttributes[key] = raw;
              }
              setPending(true);
              try {
                await submitNewPassword(
                  newPassword,
                  required.length ? userAttributes : undefined
                );
                navigate(ROUTES.admin);
              } catch (err) {
                const msg =
                  err instanceof CognitoAuthError ? err.message : "Помилка авторизації";
                setErrorMessage(msg);
              } finally {
                setPending(false);
              }
            }}
          >
            <TextField
              fullWidth
              required
              margin="normal"
              label="Новий пароль"
              type="password"
              name="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={!configured || pending}
            />
            <TextField
              fullWidth
              required
              margin="normal"
              label="Підтвердження пароля"
              type="password"
              name="confirmNewPassword"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              disabled={!configured || pending}
            />
            {(missingAttributes ?? []).map((key) => (
              <TextField
                key={key}
                fullWidth
                required
                margin="normal"
                label={labelForAttribute(key)}
                name={`attr_${key}`}
                value={extraAttrs[key] ?? (key === "email" ? email : "")}
                onChange={(e) =>
                  setExtraAttrs((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                disabled={!configured || pending}
                type={key === "email" ? "email" : "text"}
                autoComplete={key === "email" ? "email" : undefined}
              />
            ))}
            {errorMessage ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Alert>
            ) : null}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={!configured || pending}
            >
              {pending ? "Збереження…" : "Зберегти пароль і увійти"}
            </Button>
            <Button
              type="button"
              fullWidth
              sx={{ mt: 1 }}
              disabled={pending}
              onClick={() => void resetToCredentials()}
            >
              Скасувати
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
