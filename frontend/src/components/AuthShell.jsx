import { Link } from "react-router-dom";

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  compact = false,
}) {
  const brandName = "Car Dealership System";
  const brandLogoUrl = `${process.env.PUBLIC_URL}/logo.svg`;
  return (
    <div className="authShell">
      <div
        className="authCard"
        style={{
          width: "100%",
          maxWidth: compact ? "460px" : "560px",
        }}
      >
        <div className="authCardHeader">
          <Link to="/" style={{ width: "fit-content", margin: "0 auto" }}>
            <img
              src={brandLogoUrl}
              alt={brandName}
              className="authBrandMark"
            />
          </Link>
          <div className="authEyebrow">{eyebrow}</div>
          <div className="authTitle">{title}</div>
          <div className="authSubtitle">{subtitle}</div>
        </div>

        <div className="authCardBody">{children}</div>

        {footer ? (
          <div className="authCardFooter">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
