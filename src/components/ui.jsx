export const Card = ({ children, dark, className = "" }) => (
  <div className={`${dark ? "card dark" : "card"} ${className}`.trim()}>{children}</div>
);

export const Button = ({ children, variant = "primary", type = "button", ...props }) => (
  <button className={`button ${variant}`} type={type} {...props}>
    {children}
  </button>
);

export const Input = ({ className = "", ...props }) => (
  <input className={["input", className].filter(Boolean).join(" ")} {...props} />
);

export const Select = ({ children, ...props }) => (
  <select className="select" {...props}>
    {children}
  </select>
);
