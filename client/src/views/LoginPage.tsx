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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { loginWithEmailPassword, isAuthed, authReady } = useAuth();

  useEffect(() => {
    if (authReady && isAuthed) {
      navigate(ROUTES.admin);
    }
  }, [isAuthed, authReady, navigate]);

  const configured = isCognitoConfigured();

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={2} sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Вхід в адмін-панель
        </Typography>
        {!configured ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cognito не налаштовано. Додайте у <code>.env</code>:{" "}
            <code>VITE_COGNITO_USER_POOL_ID</code>, <code>VITE_COGNITO_USER_POOL_CLIENT_ID</code> (регіон
            береться з pool id). Пул має використовувати email як username; обліковий запис має бути у групі{" "}
            <code>admin</code>.
          </Alert>
        ) : null}
        <Box
          component="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setErrorMessage("");
            try {
              await loginWithEmailPassword(email, password);
              navigate(ROUTES.admin);
            } catch (err) {
              const msg =
                err instanceof CognitoAuthError
                  ? err.message
                  : "Помилка авторизації";
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
      </Paper>
    </Container>
  );
}
