const statusToneMap = {
  available: { label: "Available", badge: "badge badgeGreen" },
  reserved: { label: "Reserved", badge: "badge badgeOrange" },
  sold: { label: "Sold", badge: "badge badgePink" },
};

export const VEHICLE_TYPES = ["SUV", "Sedan", "Hatchback", "Truck", "Van", "Coupe"];
export const VEHICLE_CONDITIONS = ["Brand New", "Used (Registered)", "Reconditioned"];
export const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric", "Other"];
export const TRANSMISSION_TYPES = ["Automatic", "Manual"];
export const VEHICLE_STATUSES = ["available", "reserved", "sold"];

export function formatCurrency(value) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

export function getVehicleStatusMeta(status) {
  return statusToneMap[status] || { label: status || "Unknown", badge: "badge" };
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <div>
        <div className="sectionTitle">{title}</div>
        <div className="sub" style={{ maxWidth: "620px" }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function PhotoTile({ src, alt, onRemove, highlight = false }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "18px",
        overflow: "hidden",
        border: highlight ? "1px solid rgba(141, 187, 1, 0.5)" : "1px solid var(--border)",
        background: "rgba(255,255,255,0.74)",
      }}
    >
      <div style={{ width: "100%", aspectRatio: "4 / 3", overflow: "hidden" }}>
        <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <button
        type="button"
        className="btn btnDanger btnSmall"
        onClick={onRemove}
        style={{ position: "absolute", top: "10px", right: "10px", minWidth: "36px", padding: "8px" }}
      >
        X
      </button>
    </div>
  );
}

export default function VehicleForm({
  title,
  subtitle,
  vehicle,
  onChange,
  onSubmit,
  saving,
  submitLabel,
  onCancel,
  previews = [],
  onPickImages,
  removeImage,
  existingImages = [],
  removeExistingImage,
  maxImages = 4,
}) {
  const imageCount = existingImages.length + previews.length;
  const remainingSlots = Math.max(0, maxImages - imageCount);

  return (
    <div className="page">
      <div className="pageHead">
        <div>
          <div className="pageTitle">{title}</div>
          <div className="pageSub">{subtitle}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "20px", maxWidth: "1040px", margin: "0 auto" }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "20px" }}>
          <SectionCard title="Vehicle Identity" subtitle="Keep the basic profile clear so the inventory list reads cleanly and professionally.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <label className="label">Brand</label>
                <input className="input" name="brand" value={vehicle.brand} onChange={onChange} placeholder="Toyota, BMW, Nissan..." required />
              </div>
              <div>
                <label className="label">Model</label>
                <input className="input" name="model" value={vehicle.model || ""} onChange={onChange} placeholder="Civic, X5, Prius..." />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="select" name="type" value={vehicle.type} onChange={onChange} required>
                  <option value="">Select vehicle type</option>
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <input className="input" type="number" name="year" value={vehicle.year} onChange={onChange} placeholder="2024" required />
              </div>
              <div>
                <label className="label">Price</label>
                <input className="input" type="number" name="price" value={vehicle.price} onChange={onChange} placeholder="9500000" required />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Inventory State" subtitle="Track whether the vehicle is available, reserved, or already sold, with the registration kept nearby.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <div>
                <label className="label">Status</label>
                <select className="select" name="status" value={vehicle.status} onChange={onChange}>
                  {VEHICLE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Registration Number</label>
                <input className="input" name="vehicleNumber" value={vehicle.vehicleNumber} onChange={onChange} placeholder="CAB-1234" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Vehicle Specifications" subtitle="Optional fields help buyers and staff filter inventory more precisely by fuel, gearbox, and mileage.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <label className="label">Condition</label>
                <select className="select" name="condition" value={vehicle.condition || ""} onChange={onChange}>
                  <option value="">Not specified</option>
                  {VEHICLE_CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Fuel Type</label>
                <select className="select" name="fuelType" value={vehicle.fuelType || ""} onChange={onChange}>
                  <option value="">Not specified</option>
                  {FUEL_TYPES.map((fuelType) => (
                    <option key={fuelType} value={fuelType}>
                      {fuelType}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Transmission</label>
                <select className="select" name="transmission" value={vehicle.transmission || ""} onChange={onChange}>
                  <option value="">Not specified</option>
                  {TRANSMISSION_TYPES.map((transmission) => (
                    <option key={transmission} value={transmission}>
                      {transmission}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Mileage (km)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  name="mileage"
                  value={vehicle.mileage ?? ""}
                  onChange={onChange}
                  placeholder="45000"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Vehicle Notes" subtitle="Add concise features, condition highlights, or anything your staff should know while selling the car.">
            <div>
              <label className="label">Details</label>
              <textarea
                className="textarea"
                name="details"
                rows={5}
                value={vehicle.details}
                onChange={onChange}
                placeholder="Condition, mileage, premium features, service history, or showroom notes."
              />
            </div>
          </SectionCard>

          <SectionCard title="Photos" subtitle="Use up to four clear images so the inventory cards stay sharp and premium without feeling overloaded.">
            <div style={{ display: "grid", gap: "16px" }}>
              <div
                style={{
                  border: "1px dashed var(--border)",
                  borderRadius: "18px",
                  padding: "24px",
                  background: "rgba(255,255,255,0.72)",
                  display: "grid",
                  gap: "8px",
                  justifyItems: "center",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "28px" }}>+</div>
                <div style={{ fontWeight: 700, color: "var(--text)" }}>Upload vehicle photos</div>
                <div className="sub">
                  {remainingSlots > 0 ? `${remainingSlots} image slot${remainingSlots === 1 ? "" : "s"} left` : "Photo limit reached"}
                </div>
                <input
                  id="vehicle-image-picker"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPickImages}
                  disabled={remainingSlots <= 0}
                  style={{ display: "none" }}
                />
                <label htmlFor="vehicle-image-picker" className="btn" style={{ cursor: remainingSlots > 0 ? "pointer" : "not-allowed", opacity: remainingSlots > 0 ? 1 : 0.6 }}>
                  Select Images
                </label>
              </div>

              {existingImages.length > 0 && (
                <div style={{ display: "grid", gap: "12px" }}>
                  <div className="label">Current Photos</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                    {existingImages.map((image) => (
                      <PhotoTile
                        key={image.filename || image.url}
                        src={image.url}
                        alt={image.filename || "vehicle photo"}
                        onRemove={() => removeExistingImage(image.filename)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {previews.length > 0 && (
                <div style={{ display: "grid", gap: "12px" }}>
                  <div className="label">New Photos</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                    {previews.map((src, index) => (
                      <PhotoTile key={src} src={src} alt={`preview ${index + 1}`} onRemove={() => removeImage(index)} highlight />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btnPrimary" disabled={saving}>
              {saving ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
