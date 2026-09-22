import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";

import VehicleList from "../pages/Vehicles/VehicleList";
import AddVehicle from "../pages/Vehicles/AddVehicle";
import EditVehicle from "../pages/Vehicles/EditVehicle";
import VehicleDetail from "../pages/Vehicles/VehicleDetail";

import LeadList from "../pages/Leads/LeadList";
import AddLead from "../pages/Leads/AddLead";
import EditLead from "../pages/Leads/EditLead";

import AppointmentList from "../pages/Appointments/AppointmentList";
import AddAppointment from "../pages/Appointments/AddAppointment";
import EditAppointment from "../pages/Appointments/EditAppointment";
import CreateUser from "../pages/Admin/CreateUser";

import CustomerBookAppointment from "../pages/Appointments/Customer/CustomerBookAppointment";
import MyAppointments from "../pages/Appointments/Customer/MyAppointments";
import EditMyAppointment from "../pages/Appointments/Customer/EditMyAppointment";

import SaleList from "../pages/Sales/SaleList";
import AddSale from "../pages/Sales/AddSale";
import EditSale from "../pages/Sales/EditSale";

import DocumentList from "../pages/Documents/DocumentList";

import UserManagementList from "../pages/Admin/UserManagementList";
import EditStaff from "../pages/Admin/EditStaff";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import Activities from "../pages/Admin/Activities";
import RequireAuth from "../components/RequireAuth";
import RequireGuest from "../components/RequireGuest";

import AddDocument from "../pages/Documents/AddDocument";
import EditDocument from "../pages/Documents/EditDocument";

import EventList from "../pages/Events/EventList";
import AddEvent from "../pages/Events/AddEvent";
import EditEvent from "../pages/Events/EditEvent";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Vehicle Routes - Admin can manage, staff can review, customers can browse */}
      <Route path="/vehicles/add" element={<RequireAuth roles={["admin"]}>
        <AddVehicle />
      </RequireAuth>} />
      <Route path="/vehicles/edit/:id" element={<RequireAuth roles={["admin"]}>
        <EditVehicle />
      </RequireAuth>} />
      <Route path="/vehicles/:id" element={<VehicleDetail />} />
      <Route path="/vehicles" element={<VehicleList />} />

      {/* Lead Routes - Staff/Admin/Manager only */}
      <Route path="/leads" element={<RequireAuth roles={["admin", "staff"]}>
        <LeadList />
      </RequireAuth>} />
      <Route path="/leads/add" element={<RequireAuth roles={["admin", "staff"]}>
        <AddLead />
      </RequireAuth>} />
      <Route path="/leads/edit/:id" element={<RequireAuth roles={["admin", "staff"]}>
        <EditLead />
      </RequireAuth>} />

      {/* Appointment Routes - Staff/Admin/Manager only */}
      <Route path="/appointments" element={<RequireAuth roles={["admin", "staff"]}>
        <AppointmentList />
      </RequireAuth>} />
      <Route path="/appointments/add" element={<RequireAuth roles={["admin", "staff"]}>
        <AddAppointment />
      </RequireAuth>} />
      <Route path="/appointments/edit/:id" element={<RequireAuth roles={["admin", "staff"]}>
        <EditAppointment />
      </RequireAuth>} />

      {/* Admin Only Routes */}
      <Route path="/admin/create-staff" element={<RequireAuth roles={["admin"]}>
        <CreateUser />
      </RequireAuth>} />

      {/* Customer Appointment Routes - All authenticated users */}
      <Route path="/book-appointment" element={<RequireAuth roles={["user", "admin", "staff"]}>
        <CustomerBookAppointment />
      </RequireAuth>} />
      <Route path="/my-appointments" element={<RequireAuth roles={["user", "admin", "staff"]}>
        <MyAppointments />
      </RequireAuth>} />
      <Route path="/edit-my-appointment/:id" element={<RequireAuth roles={["user", "admin", "staff"]}>
        <EditMyAppointment />
      </RequireAuth>} />

      {/* Sales Routes - Staff/Admin/Manager only */}
      <Route path="/sales" element={<RequireAuth roles={["admin", "staff"]}>
        <SaleList />
      </RequireAuth>} />
      <Route path="/sales/add" element={<RequireAuth roles={["admin", "staff"]}>
        <AddSale />
      </RequireAuth>} />
      <Route path="/sales/edit/:id" element={<RequireAuth roles={["admin", "staff"]}>
        <EditSale />
      </RequireAuth>} />

      {/* Document Routes - Staff/Admin/Manager only */}
      <Route path="/documents" element={<RequireAuth roles={["admin", "staff"]}>
        <DocumentList />
      </RequireAuth>} />
      <Route path="/documents/add" element={<RequireAuth roles={["admin", "staff"]}>
        <AddDocument />
      </RequireAuth>} />
      <Route path="/documents/edit/:id" element={<RequireAuth roles={["admin", "staff"]}>
        <EditDocument />
      </RequireAuth>} />

      {/* Event Routes - Staff/Admin/Manager only */}
      <Route path="/events" element={<RequireAuth roles={["admin", "staff"]}>
        <EventList />
      </RequireAuth>} />
      <Route path="/events/add" element={<RequireAuth roles={["admin", "staff"]}>
        <AddEvent />
      </RequireAuth>} />
      <Route path="/events/edit/:id" element={<RequireAuth roles={["admin", "staff"]}>
        <EditEvent />
      </RequireAuth>} />

      {/* Auth Routes - Public */}
      <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
      <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
      <Route path="/forgot-password" element={<RequireGuest><ForgotPassword /></RequireGuest>} />
      <Route path="/reset-password" element={<RequireGuest><ResetPassword /></RequireGuest>} />

      {/* Admin Dashboard & Staff Management */}
      <Route path="/admin/dashboard" element={<RequireAuth roles={["admin"]}>
        <AdminDashboard />
      </RequireAuth>} />
      <Route path="/admin/activities" element={<RequireAuth roles={["admin"]}>
        <Activities />
      </RequireAuth>} />
      <Route path="/admin/staff" element={<RequireAuth roles={["admin"]}>
        <UserManagementList />
      </RequireAuth>} />
      <Route path="/admin/staff/edit/:id" element={<RequireAuth roles={["admin"]}>
        <EditStaff />
      </RequireAuth>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default AppRoutes;
