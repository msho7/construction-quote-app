import { FormEvent, useState } from "react";
import { HardHat, Lock, Mail, UserRound } from "lucide-react";
import { LOGIN_STYLES } from "./loginStyles";

type LoginPageProps = {
  onLogin: (credentials: { email: string; password: string }) => { ok: boolean; message?: string };
  onCreateAccount: (account: { name: string; email: string; password: string; role: string }) => { ok: boolean; message?: string };
  allowInitialAccountSetup?: boolean;
};

export default function LoginPage({ onLogin, onCreateAccount, allowInitialAccountSetup = false }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "create">(() => allowInitialAccountSetup ? "create" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const isCreatingAccount = allowInitialAccountSetup && mode === "create";

  const switchMode = () => {
    if (!allowInitialAccountSetup) return;
    setMode((currentMode) => currentMode === "login" ? "create" : "login");
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }

    if (isCreatingAccount) {
      if (!trimmedName) {
        setError("Enter your name to create an account.");
        return;
      }

      if (password.length < 6) {
        setError("Use at least 6 characters for the password.");
        return;
      }

      if (password !== confirmPassword) {
        setError("The passwords do not match.");
        return;
      }

      const result = onCreateAccount({
        name: trimmedName,
        email: trimmedEmail,
        password,
        role: "administrator"
      });

      if (!result.ok) {
        setError(result.message || "Could not create that account.");
        return;
      }

      setError("");
      return;
    }

    const result = onLogin({
      email: trimmedEmail,
      password
    });

    if (!result.ok) {
      setError(result.message || "Could not sign in.");
      return;
    }

    setError("");
  };

  return (
    <>
      <style>{LOGIN_STYLES}</style>
      <main className="login-page">
        <section className="login-visual" aria-label="Construction Quote App">
          <div className="login-brand">
            <span className="login-brand-mark" aria-hidden="true">
              <HardHat size={22} strokeWidth={2.4} />
            </span>
            <span>BuildQuote</span>
          </div>

          <div className="login-hero">
            <h1>Construction command center</h1>
            <p>Sign in to manage scopes, quotes, customers, schedules, contractors, and field work from one workspace.</p>
          </div>
        </section>

        <section className="login-panel-wrap">
          <div className="login-panel">
            <h2>{isCreatingAccount ? "Create Account" : "Sign In"}</h2>
            <p>{isCreatingAccount ? "Create the first administrator account for this device." : "Use your administrator-created account to open the workspace."}</p>

            <form className="login-form" onSubmit={submitLogin}>
              {isCreatingAccount ? (
                <label>
                  Full Name
                  <span className="login-input-wrap">
                    <UserRound size={18} aria-hidden="true" />
                    <input
                      className="login-input"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </span>
                </label>
              ) : null}

              <label>
                Email
                <span className="login-input-wrap">
                  <Mail size={18} aria-hidden="true" />
                  <input
                    className="login-input"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </span>
              </label>

              <label>
                Password
                <span className="login-input-wrap">
                  <Lock size={18} aria-hidden="true" />
                  <input
                    className="login-input"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </span>
              </label>

              {isCreatingAccount ? (
                <>
                  <label>
                    Confirm Password
                    <span className="login-input-wrap">
                      <Lock size={18} aria-hidden="true" />
                      <input
                        className="login-input"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                      />
                    </span>
                  </label>

                  <input type="hidden" value="administrator" readOnly />
                </>
              ) : null}

              {error ? <p className="login-error">{error}</p> : null}

              <button className="login-submit" type="submit">
                {isCreatingAccount ? "Create Account" : "Sign In"}
              </button>
            </form>

            {allowInitialAccountSetup ? (
              <button className="login-mode-toggle" type="button" onClick={switchMode}>
                {isCreatingAccount ? "Already have an administrator account? Sign in" : "Set up administrator account"}
              </button>
            ) : null}

            <p className="login-note">
              {allowInitialAccountSetup
                ? "After the first administrator is created, new users must be added by an administrator in Settings."
                : "New users must be added by an administrator in Settings."}
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
