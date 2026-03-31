import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";
import { useAuth } from "../state/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { setToken, isAuthed } = useAuth();

  useEffect(() => {
    if (isAuthed) navigate("/admin");
  }, [isAuthed, navigate]);

  return (
    <div className="login-page">
      <h1>Вхід в адмін-панель</h1>
      <form
        className="login-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setErrorMessage("");
          try {
            const data = await apiPost<{ token: string }>("/api/auth/login", { username, password });
            setToken(data.token);
            navigate("/admin");
          } catch {
            setErrorMessage("Помилка авторизації");
          } finally {
            setPending(false);
          }
        }}
      >
        <label>
          Логін:
          <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" required />
        </label>
        <label>
          Пароль:
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        {errorMessage ? <p className="error">{errorMessage}</p> : null}
        <button type="submit" disabled={pending}>{pending ? "Вхід..." : "Увійти"}</button>
      </form>
    </div>
  );
}
