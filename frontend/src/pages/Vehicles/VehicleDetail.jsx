import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildAssetUrl } from "../../api/axios";
import { getVehicleById } from "../../api/vehicleApi";
import { getAuth } from "../../utils/auth";

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [error, setError] = useState("");
  const [imageErrors, setImageErrors] = useState({});
  const auth = getAuth();
  const canSeeRegistration = ["admin", "staff"].includes(auth?.role || "");

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getVehicleById(id);
        setVehicle(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load vehicle details");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  // Auto-rotate images
  useEffect(() => {
    if (!vehicle || !vehicle.images || vehicle.images.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setSelectedImageIndex(prev => (prev + 1) % vehicle.images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [vehicle]);

  const handleImageError = (index) => {
    setImageErrors(prev => ({
      ...prev,
      [index]: true
    }));
  };

  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ color: "var(--text-light)", fontSize: "16px" }}>Loading vehicle details...</div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="page" style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ color: "var(--text-light)", fontSize: "16px", marginBottom: 24 }}>
          {error || "Vehicle not found"}
        </div>
        <button onClick={() => navigate("/")} className="btn btnPrimary">
          Back to Home
        </button>
      </div>
    );
  }

  const mainImage = buildAssetUrl(vehicle.images?.[selectedImageIndex]?.url) || `https://via.placeholder.com/600x400?text=${vehicle.brand}`;
  const vehicleName = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh", paddingBottom: "40px" }}>
      {/* Breadcrumb */}
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px 20px 0 20px"
      }}>
        <button 
          onClick={() => navigate("/vehicles")} 
          style={{
            background: "none",
            border: "none",
            color: "var(--primary)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            letterSpacing: "0.2px"
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          ← Back to Inventory
        </button>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "32px 20px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 48,
        alignItems: "start"
      }}>
        {/* Gallery Section */}
        <div>
          {/* Main Image */}
          <div style={{
            width: "100%",
            aspectRatio: "4 / 3",
            backgroundColor: "var(--bg-card)",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            position: "relative"
          }}>
            {imageErrors[selectedImageIndex] ? (
              <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--bg)",
                color: "var(--text-muted)",
                fontSize: "14px",
                fontWeight: 500
              }}>
                Image Not Available
              </div>
            ) : (
              <img
                src={mainImage}
                alt={`${vehicleName || vehicle.brand} ${vehicle.type}`}
                onError={() => handleImageError(selectedImageIndex)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
            )}

            {/* Image Counter */}
            {vehicle.images && vehicle.images.length > 1 && (
              <div style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                backgroundColor: "rgba(0,0,0,0.6)",
                color: "white",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                backdropFilter: "blur(10px)"
              }}>
                {selectedImageIndex + 1} / {vehicle.images.length}
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {vehicle.images && vehicle.images.length > 1 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: 12
            }}>
              {vehicle.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    cursor: "pointer",
                    border: selectedImageIndex === idx ? "2px solid var(--primary)" : "1px solid var(--border)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: selectedImageIndex === idx ? "0 4px 12px rgba(76, 175, 80, 0.2)" : "none"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(76, 175, 80, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    if (selectedImageIndex !== idx) {
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  {imageErrors[idx] ? (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "var(--bg)",
                      color: "var(--text-muted)",
                      fontSize: "12px"
                    }}>
                      N/A
                    </div>
                  ) : (
                    <img
                      src={img.url}
                      alt={`View ${idx + 1}`}
                      onError={() => handleImageError(idx)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div>
          {/* Title Section */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontSize: "40px",
              fontWeight: 800,
              color: "var(--text)",
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px"
            }}>
              {vehicleName || vehicle.brand}
            </h1>
            <div style={{
              fontSize: "16px",
              color: "var(--text-muted)",
              fontWeight: 300,
              letterSpacing: "0.2px"
            }}>
              {vehicle.type} • {vehicle.year}
              {vehicle.fuelType ? ` • ${vehicle.fuelType}` : ""}
              {vehicle.transmission ? ` • ${vehicle.transmission}` : ""}
            </div>
          </div>

          {/* Status Badge */}
          <div style={{
            display: "inline-block",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            marginBottom: 24,
            backgroundColor: 
              vehicle.status === "available" ? "#d4edda" :
              vehicle.status === "reserved" ? "#fff3cd" :
              "#f8d7da",
            color: 
              vehicle.status === "available" ? "#155724" :
              vehicle.status === "reserved" ? "#856404" :
              "#721c24"
          }}>
            {vehicle.status || "Available"}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 280px))",
              justifyContent: "start",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <DetailStatCard label="Price" value={`LKR ${Number(vehicle.price || 0).toLocaleString()}`} accent="var(--primary)" />
            <DetailStatCard label="Condition" value={vehicle.condition || "Not specified"} />
            {canSeeRegistration && vehicle.vehicleNumber ? (
              <DetailStatCard label="Registration" value={vehicle.vehicleNumber} />
            ) : null}
          </div>

          {/* Specifications Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 32
          }}>
            <PremiumDetailBox label="Brand" value={vehicle.brand} />
            <PremiumDetailBox label="Model" value={vehicle.model || "Not specified"} />
            <PremiumDetailBox label="Type" value={vehicle.type} />
            <PremiumDetailBox label="Condition" value={vehicle.condition || "Not specified"} />
            <PremiumDetailBox label="Year" value={vehicle.year} />
            <PremiumDetailBox label="Status" value={vehicle.status || "Available"} />
            <PremiumDetailBox label="Fuel Type" value={vehicle.fuelType || "Not specified"} />
            <PremiumDetailBox label="Transmission" value={vehicle.transmission || "Not specified"} />
            <PremiumDetailBox label="Mileage" value={vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} km` : "Not specified"} />
            {canSeeRegistration && vehicle.vehicleNumber && (
              <div style={{ gridColumn: "span 2" }}>
                <PremiumDetailBox label="Registration" value={vehicle.vehicleNumber} />
              </div>
            )}
          </div>

          {/* Description */}
          {vehicle.details && (
            <div
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: 32,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                maxWidth: "580px",
              }}
            >
              <div style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                marginBottom: "12px"
              }}>
                About This Vehicle
              </div>
              <div style={{
                fontSize: "14px",
                color: "var(--text)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                fontWeight: 300
              }}>
                {vehicle.details}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12
          }}>
            <button
              onClick={() => navigate("/book-appointment", { state: { vehicleId: vehicle._id } })}
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 700,
                backgroundColor: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.3px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(76, 175, 80, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Book Test Drive
            </button>

            <button
              onClick={() => navigate("/vehicles")}
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                backgroundColor: "var(--bg-card)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.2px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary-soft)";
                e.currentTarget.style.borderColor = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-card)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              ← Back to Inventory
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// Premium Detail Box Component
function PremiumDetailBox({ label, value }) {
  return (
    <div style={{
      backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      padding: "16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
    }}>
      <div style={{
        fontSize: "11px",
        fontWeight: 700,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.3px",
        marginBottom: "6px"
      }}>
        {label}
      </div>
      <div style={{
        fontSize: "15px",
        fontWeight: 600,
        color: "var(--text)",
        letterSpacing: "-0.2px"
      }}>
        {value}
      </div>
    </div>
  );
}

function DetailStatCard({ label, value, accent = "var(--text)" }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.4px",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: 800,
          color: accent,
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
