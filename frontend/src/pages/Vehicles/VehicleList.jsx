import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildAssetUrl } from "../../api/axios";
import { useToast } from "../../components/ToastProvider";
import { deleteVehicle, getVehicles } from "../../api/vehicleApi";
import { getAuth } from "../../utils/auth";
import { formatCurrency, getVehicleStatusMeta } from "./VehicleForm";

function getImageUrl(url) {
  return buildAssetUrl(url);
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

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
      <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", minWidth: "92px" }}>
        {label}
      </div>
      <div style={{ textAlign: "right", color: "var(--text)", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const auth = getAuth();
  const role = auth?.role;
  const canSeeFullInventory = role === "admin" || role === "staff";
  const canManageVehicles = role === "admin";
  const canSeeRegistration = canSeeFullInventory;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getVehicles(canSeeFullInventory ? {} : { status: "available" });
      setVehicles(response.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load vehicles", "Load failed");
    } finally {
      setLoading(false);
    }
  }, [canSeeFullInventory, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = vehicles.length;
    const available = vehicles.filter((vehicle) => vehicle.status === "available").length;
    const reserved = vehicles.filter((vehicle) => vehicle.status === "reserved").length;
    const sold = vehicles.filter((vehicle) => vehicle.status === "sold").length;
    const totalValue = vehicles.reduce((sum, vehicle) => sum + Number(vehicle.price || 0), 0);

    return { total, available, reserved, sold, totalValue };
  }, [vehicles]);

  const bookNow = (vehicleId, status) => {
    if (status !== "available") {
      toast.info("This vehicle is not currently available for booking.");
      return;
    }
    if (!localStorage.getItem("token")) {
      toast.info("Please login to book an appointment.");
      return navigate("/login");
    }
    navigate("/book-appointment", { state: { vehicleId } });
  };

  const onDelete = async (id) => {
    if (!canManageVehicles) {
      toast.error("Access denied");
      return;
    }
    if (!window.confirm("Delete this vehicle permanently?")) return;

    try {
      await deleteVehicle(id);
      setVehicles((current) => current.filter((vehicle) => vehicle._id !== id));
      toast.success("Vehicle deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed", "Delete failed");
    }
  };

  return (
    <div className="page">
      <div className="pageHead">
        <div>
          <div className="pageTitle">Vehicle Inventory</div>
        </div>
      </div>

      <div className="kpiGrid">
        <MetricCard label="Total Vehicles" value={loading ? "—" : stats.total} sub="Complete inventory" />
        <MetricCard label="Available" value={loading ? "—" : stats.available} sub="Ready for appointments" />
        <MetricCard label="Reserved" value={loading ? "—" : stats.reserved} sub="Pending commitments" />
        <MetricCard label="Inventory Value" value={loading ? "—" : formatCurrency(stats.totalValue)} sub="Combined listed value" />
      </div>

      <div style={{ marginBottom: "20px", display: "grid", gap: "18px" }}>
        <div className="row" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="sectionTitle">Browse Inventory</div>
            <div className="sub">
              {canSeeFullInventory
                ? "Review the full inventory and move straight into stock management."
                : "Browse available vehicles and book a visit or test drive when something stands out."}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
            <button className="btn" onClick={load} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            {canManageVehicles && (
              <button className="btn btnPrimary" onClick={() => navigate("/vehicles/add")}>
                Add Vehicle
              </button>
            )}
          </div>
        </div>
      </div>

      {!loading && vehicles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
          {canSeeFullInventory ? "No vehicles found." : "No available vehicles found right now."}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            justifyContent: "start",
            gap: "18px",
          }}
        >
          {vehicles.map((vehicle) => {
            const cover = getImageUrl(vehicle?.images?.[0]?.url);
            const statusMeta = getVehicleStatusMeta(vehicle.status);

            return (
              <div
                key={vehicle._id}
                className="card"
                style={{ overflow: "hidden", display: "grid", width: "100%", maxWidth: "340px" }}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/vehicles/${vehicle._id}`)}
                  style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", textAlign: "left" }}
                >
                  <div
                    style={{
                      position: "relative",
                      aspectRatio: "4 / 3",
                      background: "linear-gradient(180deg, rgba(12,58,87,0.08), rgba(12,58,87,0.03))",
                      padding: "14px",
                    }}
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={vehicle.brand}
                        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--text-muted)", fontWeight: 600 }}>
                        No Photo Available
                      </div>
                    )}

                    <div style={{ position: "absolute", top: "14px", right: "14px" }}>
                      <span className={statusMeta.badge}>{statusMeta.label}</span>
                    </div>
                  </div>
                </button>

                <div className="cardPad" style={{ display: "grid", gap: "16px" }}>
                  <div style={{ display: "grid", gap: "4px" }}>
                    <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>
                      {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
                    </div>
                    <div className="sub">{vehicle.type || "Type"} • {vehicle.year || "Year not set"}</div>
                  </div>

                  <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary)" }}>{formatCurrency(vehicle.price)}</div>

                  <div style={{ display: "grid", gap: "10px" }}>
                    <DetailRow label="Model" value={vehicle.model || "Not specified"} />
                    {canSeeRegistration && vehicle.vehicleNumber ? (
                      <DetailRow label="Registration" value={vehicle.vehicleNumber} />
                    ) : null}
                    <DetailRow label="Condition" value={vehicle.condition || "Not specified"} />
                    <DetailRow label="Fuel" value={vehicle.fuelType || "Not specified"} />
                    <DetailRow label="Transmission" value={vehicle.transmission || "Not specified"} />
                    <DetailRow label="Mileage" value={vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} km` : "Not specified"} />
                    <DetailRow
                      label="Notes"
                      value={vehicle.details ? `${vehicle.details.slice(0, 56)}${vehicle.details.length > 56 ? "..." : ""}` : "No details added"}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btnPrimary"
                      onClick={() => bookNow(vehicle._id, vehicle.status)}
                      disabled={vehicle.status !== "available"}
                      style={{ flex: 1 }}
                    >
                      Book Now
                    </button>

                    {canManageVehicles && (
                      <button type="button" className="btn" onClick={() => navigate(`/vehicles/edit/${vehicle._id}`)} style={{ flex: 1 }}>
                        Edit
                      </button>
                    )}

                    {canManageVehicles && (
                      <button type="button" className="btn btnDanger" onClick={() => onDelete(vehicle._id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
