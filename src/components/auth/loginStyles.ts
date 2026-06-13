export const LOGIN_STYLES = `
  * { box-sizing: border-box; }
  html,
  body,
  #root {
    min-height: 100vh;
    min-height: 100dvh;
  }
  body {
    margin: 0;
    font-family: Inter, Arial, sans-serif;
    background: #f3f4f6;
  }
  .login-page {
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(380px, 0.9fr);
    background: #f3f4f6;
    color: #111827;
  }
  .login-visual {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100%;
    padding: 42px;
    background:
      linear-gradient(rgba(15, 23, 42, 0.62), rgba(15, 23, 42, 0.78)),
      url("https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80");
    background-size: cover;
    background-position: center;
    color: #ffffff;
  }
  .login-brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-weight: 800;
  }
  .login-brand-mark {
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: #ffffff;
    color: #111827;
  }
  .login-hero {
    max-width: 680px;
  }
  .login-hero h1 {
    margin: 0;
    max-width: 620px;
    font-size: clamp(2.2rem, 5vw, 4.8rem);
    line-height: 0.98;
    letter-spacing: 0;
  }
  .login-hero p {
    max-width: 560px;
    margin: 18px 0 0;
    color: rgba(255, 255, 255, 0.82);
    font-size: 1.04rem;
    line-height: 1.55;
  }
  .login-panel-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }
  .login-panel {
    width: min(100%, 430px);
  }
  .login-panel h2 {
    margin: 0;
    font-size: 1.85rem;
    letter-spacing: 0;
  }
  .login-panel > p {
    margin: 8px 0 24px;
    color: #6b7280;
    line-height: 1.45;
  }
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .login-form label {
    display: flex;
    flex-direction: column;
    gap: 7px;
    color: #374151;
    font-weight: 700;
    font-size: 0.9rem;
  }
  .login-input-wrap {
    position: relative;
  }
  .login-input-wrap svg {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
  }
  .login-input,
  .login-select {
    width: 100%;
    min-height: 46px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #ffffff;
    color: #111827;
    padding: 11px 12px 11px 42px;
    font: inherit;
  }
  .login-select {
    padding-left: 12px;
  }
  .login-input:focus {
    outline: 2px solid rgba(37, 99, 235, 0.25);
    border-color: #2563eb;
  }
  .login-error {
    margin: 0;
    padding: 11px 12px;
    border: 1px solid #fecaca;
    border-radius: 8px;
    background: #fef2f2;
    color: #991b1b;
    line-height: 1.35;
  }
  .login-submit {
    min-height: 48px;
    border: 0;
    border-radius: 8px;
    background: #2563eb;
    color: #ffffff;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }
  .login-submit:hover {
    background: #1d4ed8;
  }
  .login-mode-toggle {
    width: 100%;
    min-height: 42px;
    margin-top: 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #ffffff;
    color: #1d4ed8;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }
  .login-mode-toggle:hover {
    border-color: #93c5fd;
    background: #eff6ff;
  }
  .login-note {
    margin-top: 18px;
    color: #6b7280;
    font-size: 0.88rem;
    line-height: 1.45;
  }
  @media (max-width: 860px) {
    .login-page {
      grid-template-columns: 1fr;
    }
    .login-visual {
      min-height: 300px;
      padding: 28px;
    }
    .login-panel-wrap {
      padding: 28px 20px 36px;
    }
  }
`;
