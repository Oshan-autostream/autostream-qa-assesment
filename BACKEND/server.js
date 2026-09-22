require("./utils/loadEnv");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { startAppointmentReminder } = require("./utils/appointmentReminder");

const app = express();
const PORT = process.env.PORT || 8070;
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

const vehicle_routes = require("./routes/vehicles");

mongoose.set("bufferCommands", false);

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// routes
app.use("/api/leads", require("./routes/leads"));
app.use("/api/vehicles", vehicle_routes); // ✅ only ONCE
app.use("/api/sales", require("./routes/sales"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/customer/appointments", require("./routes/customerAppointments"));
app.use("/api/admin/users", require("./routes/adminUsers"));
app.use("/api/documents", require("./routes/physicalDocuments"));
app.use("/api/holidays", require("./routes/holidays"));
app.use("/api/events", require("./routes/events"));
app.use("/api/activities", require("./routes/activities"));

// static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/", (req, res) => res.send("API is running"));


// ✅ error handler must be LAST
app.use(require("./middleware/errorHandler"));

async function startServer() {
  if (!mongoUri) {
    console.error("MongoDB Connection Failed: missing MONGO_URI or MONGODB_URI in BACKEND/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connection success!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startAppointmentReminder();
    });
  } catch (err) {
    console.error("MongoDB Connection Failed:", err);
    process.exit(1);
  }
}

startServer();
