import { useState } from "react";

function EyeIcon({ crossed = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: "18px", height: "18px", display: "block" }}>
      <path
        d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6-9.75-6-9.75-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {crossed ? (
        <path
          d="M4 4 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

export default function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  helpText,
  validationText,
  validationColor = "var(--text-muted)",
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label ? <label className="label">{label}</label> : null}
      <div className="passwordField">
        <input
          className="input passwordInput"
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="passwordToggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          <EyeIcon crossed={visible} />
        </button>
      </div>
      {helpText ? (
        <div className="sub" style={{ marginTop: "8px" }}>
          {helpText}
        </div>
      ) : null}
      {validationText ? (
        <div className="sub" style={{ marginTop: "8px", color: validationColor }}>
          {validationText}
        </div>
      ) : null}
    </div>
  );
}
