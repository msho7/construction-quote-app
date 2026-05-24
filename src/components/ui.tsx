export const Card = ({ children, dark, className = "" }: any) => (
  <div className={`${dark ? "card dark" : "card"} ${className}`.trim()}>{children}</div>
);

export const Button = ({ children, variant = "primary", type = "button", ...props }: any) => (
  <button className={`button ${variant}`} type={type} {...props}>
    {children}
  </button>
);

export const Input = ({ className = "", ...props }: any) => (
  <input className={["input", className].filter(Boolean).join(" ")} {...props} />
);

export const Select = ({ children, ...props }: any) => (
  <select className="select" {...props}>
    {children}
  </select>
);
