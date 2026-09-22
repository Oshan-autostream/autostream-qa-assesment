import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildAssetUrl } from "../api/axios";
import { getVehicles } from "../api/vehicleApi";
import { FUEL_TYPES, TRANSMISSION_TYPES, VEHICLE_TYPES } from "./Vehicles/VehicleForm";
import { getAuth } from "../utils/auth";

function formatCurrency(value) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function getImageUrl(url) {
  return buildAssetUrl(url);
}

export default function Home() {
  const navigate = useNavigate();
  const auth = getAuth();
  const canSeeRegistration = ["admin", "staff"].includes(auth?.role || "");
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({
    q: "",
    type: "",
    fuelType: "",
    transmission: "",
    minPrice: "",
    maxPrice: "",
    minYear: "",
    maxYear: "",
    maxMileage: "",
    status: "available",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const params = Object.fromEntries(
          Object.entries(filters).filter(([, value]) => String(value ?? "").trim() !== "")
        );
        const response = await getVehicles(params);
        setVehicles(response.data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [filters]);

  const stats = useMemo(() => {
    const total = vehicles.length;
    const typeCount = new Set(vehicles.map((vehicle) => vehicle.type).filter(Boolean)).size;
    return {
      total,
      types: typeCount,
    };
  }, [vehicles]);

  const featuredVehicles = vehicles.slice(0, 3);
  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(
        ([key, value]) => key !== "status" && String(value ?? "").trim() !== ""
      ).length,
    [filters]
  );

  const onFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      type: "",
      fuelType: "",
      transmission: "",
      minPrice: "",
      maxPrice: "",
      minYear: "",
      maxYear: "",
      maxMileage: "",
      status: "available",
    });
  };

  return (
    <div className="page">
      <section
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "40px 20px 24px",
        }}
      >
        <div
          className="card"
          style={{
            overflow: "hidden",
            background:
              "radial-gradient(circle at top right, rgba(141,187,1,0.18), transparent 28%), linear-gradient(135deg, #0C3A57 0%, #11496d 58%, #8DBB01 100%)",
            color: "#fff",
          }}
        >
          <div
            className="cardPad"
            style={{
              padding: "56px 40px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
              gap: "28px",
              alignItems: "end",
            }}
          >
            <div style={{ display: "grid", gap: "18px" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.72 }}>
                Car Dealership System
              </div>
              <div style={{ fontSize: "clamp(34px, 5vw, 62px)", lineHeight: 1.04, fontWeight: 800, letterSpacing: "-0.05em", maxWidth: "760px" }}>
                Own your vehicle today.
              </div>
              <div style={{ maxWidth: "620px", fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.82)" }}>
                Explore available inventory, book a test drive, and move through appointments, sales, and aftercare.
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button className="btn" onClick={() => navigate("/vehicles")} style={{ background: "#fff", color: "var(--navy)", borderColor: "transparent" }}>
                  Browse Inventory
                </button>
                <button
                  className="btn"
                  onClick={() => navigate("/book-appointment")}
                  style={{ background: "rgba(255,255,255,0.12)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}
                >
                  Book Test Drive
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <HeroStat label="Available Vehicles" value={loading ? "—" : stats.total} />
              <HeroStat label="Vehicle Types" value={loading ? "—" : stats.types} />
              <HeroStat label="Matched Results" value={loading ? "—" : vehicles.length} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: "1320px", margin: "0 auto", padding: "8px 20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
          <MetricCard label="Showroom Ready" value={loading ? "—" : stats.total} sub="Current available stock" />
          <MetricCard label="Segments" value={loading ? "—" : stats.types} sub="SUV, sedan, hatchback and more" />
          <MetricCard label="Appointments" value="9-5" sub="Guided visits during working hours" />
        </div>
      </section>

      <section style={{ maxWidth: "1320px", margin: "0 auto", padding: "20px 20px 24px" }}>
        <div className="pageHead" style={{ marginBottom: "20px" }}>
          <div>
            <div className="pageTitle" style={{ fontSize: "30px" }}>Featured Inventory</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
            Loading featured vehicles...
          </div>
        ) : featuredVehicles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
            No vehicles are available right now.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 380px))",
              justifyContent: "start",
              gap: "18px",
            }}
          >
              {featuredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle._id} vehicle={vehicle} canSeeRegistration={canSeeRegistration} onView={() => navigate(`/vehicles/${vehicle._id}`)} onBook={() => navigate("/book-appointment", { state: { vehicleId: vehicle._id } })} />
            ))}
          </div>
        )}
      </section>

      <section style={{ maxWidth: "1320px", margin: "0 auto", padding: "20px 20px 36px" }}>
        <div style={{ display: "grid", gap: "18px" }}>
          <div className="row" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div className="sectionTitle">Search Inventory</div>
              <div className="sub">Use the same search filters here to match available vehicles before opening the full inventory page.</div>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
              <button className="btn" onClick={resetFilters}>
                Clear Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
              </button>
              <button className="btn" onClick={() => navigate("/vehicles")}>
                Open Full Inventory
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <input
              className="input"
              name="q"
              value={filters.q}
              onChange={onFilterChange}
              placeholder="Search brand, model, notes..."
            />

            <select className="select" name="type" value={filters.type} onChange={onFilterChange}>
              <option value="">All Types</option>
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select className="select" name="fuelType" value={filters.fuelType} onChange={onFilterChange}>
              <option value="">All Fuel Types</option>
              {FUEL_TYPES.map((fuelType) => (
                <option key={fuelType} value={fuelType}>
                  {fuelType}
                </option>
              ))}
            </select>

            <select className="select" name="transmission" value={filters.transmission} onChange={onFilterChange}>
              <option value="">All Transmissions</option>
              {TRANSMISSION_TYPES.map((transmission) => (
                <option key={transmission} value={transmission}>
                  {transmission}
                </option>
              ))}
            </select>

            <input className="input" type="number" min="0" name="minPrice" value={filters.minPrice} onChange={onFilterChange} placeholder="Min Price" />
            <input className="input" type="number" min="0" name="maxPrice" value={filters.maxPrice} onChange={onFilterChange} placeholder="Max Price" />
            <input className="input" type="number" min="1900" name="minYear" value={filters.minYear} onChange={onFilterChange} placeholder="Min Year" />
            <input className="input" type="number" min="1900" name="maxYear" value={filters.maxYear} onChange={onFilterChange} placeholder="Max Year" />
            <input className="input" type="number" min="0" name="maxMileage" value={filters.maxMileage} onChange={onFilterChange} placeholder="Max Mileage (km)" />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
              Loading inventory...
            </div>
          ) : vehicles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
              No vehicles found for this filter.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 360px))",
                justifyContent: "start",
                gap: "18px",
              }}
            >
              {vehicles.slice(0, 6).map((vehicle) => (
                <VehicleCard key={vehicle._id} vehicle={vehicle} compact canSeeRegistration={canSeeRegistration} onView={() => navigate(`/vehicles/${vehicle._id}`)} onBook={() => navigate("/book-appointment", { state: { vehicleId: vehicle._id } })} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 20px 56px" }}>
        <div
          className="card"
          style={{
            overflow: "hidden",
            background: "linear-gradient(135deg, rgba(12,58,87,0.98) 0%, rgba(17,73,109,0.94) 62%, rgba(141,187,1,0.88) 100%)",
            color: "#fff",
          }}
        >
          <div className="cardPad" style={{ padding: "44px 36px", display: "grid", gap: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.72 }}>
               Test Drive
            </div>
            <div style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08 }}>
              Experience the vehicle before you decide.
            </div>
            <div style={{ maxWidth: "700px", margin: "0 auto", color: "rgba(255,255,255,0.82)", lineHeight: 1.7 }}>
              Book a guided visit and let the team walk you through condition, pricing, and the right fit for your lifestyle.
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", marginTop: "6px" }}>
              <button className="btn" onClick={() => navigate("/book-appointment")} style={{ background: "#fff", color: "var(--navy)", borderColor: "transparent" }}>
                Schedule Appointment
              </button>
              <button className="btn" onClick={() => navigate("/vehicles")} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>
                View Vehicles
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "18px",
        padding: "16px 18px",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.74)", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "6px", letterSpacing: "-0.04em" }}>{value}</div>
    </div>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="kpiCard">
      <div className="kpiLabel">{label}</div>
      <div className="kpiValue" style={{ fontSize: "22px" }}>{value}</div>
      <div className="kpiSub">{sub}</div>
    </div>
  );
}

function VehicleCard({ vehicle, onView, onBook, compact = false, canSeeRegistration = false }) {
  const imageUrl = getImageUrl(vehicle.images?.[0]?.url);
  const vehicleName = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");

  return (
    <div className="card" style={{ overflow: "hidden", display: "grid", width: "100%", maxWidth: compact ? "360px" : "380px" }}>
      <button type="button" onClick={onView} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", textAlign: "left" }}>
        <div
          style={{
            aspectRatio: compact ? "16 / 11" : "4 / 3",
            background: "linear-gradient(180deg, rgba(12,58,87,0.08), rgba(12,58,87,0.03))",
            padding: compact ? "12px" : "14px",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={vehicle.brand}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--text-muted)", fontWeight: 600 }}>
              No Image Available
            </div>
          )}
        </div>
      </button>

      <div className="cardPad" style={{ display: "grid", gap: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>{vehicleName || vehicle.brand}</div>
            <div className="sub">{vehicle.type || "Type"} • {vehicle.year || "Year not set"}</div>
          </div>
          <span className="badge badgeGreen">{vehicle.status || "available"}</span>
        </div>

        <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary)" }}>{formatCurrency(vehicle.price)}</div>

        <div style={{ display: "grid", gap: "8px" }}>
          <InfoRow label="Condition" value={vehicle.condition || "Not specified"} />
          {canSeeRegistration && vehicle.vehicleNumber ? <InfoRow label="Registration" value={vehicle.vehicleNumber} /> : null}
          <InfoRow
            label="Details"
            value={vehicle.details ? `${vehicle.details.slice(0, 52)}${vehicle.details.length > 52 ? "..." : ""}` : "-"}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="btn btnPrimary" onClick={onView} style={{ flex: 1 }}>
            View Details
          </button>
          <button className="btn" onClick={onBook} style={{ flex: 1 }}>
            Book Drive
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
      <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", minWidth: "92px" }}>
        {label}
      </div>
      <div style={{ textAlign: "right", color: "var(--text)", fontWeight: 600 }}>{value}</div>
    </div>
  );
}
