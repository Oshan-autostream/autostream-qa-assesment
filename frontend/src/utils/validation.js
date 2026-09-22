const MAX_VEHICLE_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PERSON_NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function normalizePhoneNumber(phone) {
  return String(phone || "").replace(/\D/g, "");
}

export function normalizePersonName(name) {
  return String(name || "")
    .replace(/[^A-Za-z\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\s+/g, "");
}

export function isValidEmailAddress(email) {
  const value = normalizeEmail(email);
  if (!value || value.includes(" ")) return false;

  const parts = value.split("@");
  if (parts.length !== 2) return false;

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart || !domainPart.includes(".")) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) return false;

  const labels = domainPart.split(".");
  if (labels.length < 2) return false;

  const hasInvalidLabel = labels.some(
    (label) => !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
  );
  if (hasInvalidLabel) return false;

  const topLevelDomain = labels[labels.length - 1];
  return /^[a-z]{2,}$/i.test(topLevelDomain);
}

export function validateEmailAddress(email) {
  if (!normalizeEmail(email)) return "Email is required";
  if (!isValidEmailAddress(email)) {
    return "Please enter a valid email address with a real domain like gmail.com, yahoo.com, or outlook.com";
  }
  return "";
}

export function validatePhoneNumber(phone, label = "Phone number") {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) return `${label} is required`;
  if (!/^\d{10}$/.test(normalizedPhone)) return `${label} must contain exactly 10 digits`;
  return "";
}

export function validateStrongPassword(password) {
  if (!password?.trim()) return "Password is required";
  if (!STRONG_PASSWORD_REGEX.test(password.trim())) {
    return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character";
  }
  return "";
}

export function validatePersonName(name, label = "Name") {
  const normalizedName = normalizePersonName(name).trim();
  if (!normalizedName) return `${label} is required`;
  if (!PERSON_NAME_REGEX.test(normalizedName)) {
    return `${label} can contain letters and spaces only`;
  }
  return "";
}

export function validateVehicleForm(vehicle) {
  const currentYear = new Date().getFullYear();
  const yearNumber = Number(vehicle.year);
  const priceNumber = Number(vehicle.price);
  const mileageNumber = vehicle.mileage === "" || vehicle.mileage === null ? null : Number(vehicle.mileage);

  if (!vehicle.brand?.trim()) return "Brand is required";
  if (!vehicle.type) return "Vehicle type is required";
  if (!vehicle.year) return "Year is required";
  if (Number.isNaN(yearNumber)) return "Year must be a number";
  if (yearNumber > currentYear) return `Year cannot be in the future (max ${currentYear})`;
  if (yearNumber < 1900) return "Year must be 1900 or above";
  if (!vehicle.price && vehicle.price !== 0) return "Price is required";
  if (Number.isNaN(priceNumber) || priceNumber < 0) return "Price must be 0 or more";
  if (mileageNumber !== null && (Number.isNaN(mileageNumber) || mileageNumber < 0)) return "Mileage must be 0 or more";
  return "";
}

export function validateVehicleImages(files = [], existingCount = 0, maxImages = 4) {
  if (existingCount + files.length > maxImages) {
    return `You can upload a maximum of ${maxImages} vehicle images.`;
  }

  for (const file of files) {
    if (!String(file.type || "").startsWith("image/")) {
      return "Only image files can be uploaded for vehicles.";
    }

    if (file.size > MAX_VEHICLE_IMAGE_SIZE_BYTES) {
      return "Each vehicle image must be smaller than 15 MB.";
    }
  }

  return "";
}

export function validateLeadForm(form) {
  if (!form.name?.trim()) return "Lead name is required";
  const phoneError = validatePhoneNumber(form.contact_number, "Contact number");
  if (phoneError) return phoneError;
  const emailError = validateEmailAddress(form.email);
  if (emailError) return emailError;
  if (!form.lead_source?.trim()) return "Lead source is required";
  return "";
}

export function validateUserForm(form, { requirePassword = false, requirePasswordConfirmation = false } = {}) {
  const nameError = validatePersonName(form.name);
  if (nameError) return nameError;
  const emailError = validateEmailAddress(form.email);
  if (emailError) return emailError;
  if (!form.role?.trim()) return "Role is required";
  if (requirePassword) {
    const passwordError = validateStrongPassword(form.password);
    if (passwordError) return passwordError;
  }
  if (requirePasswordConfirmation && !form.passwordConfirm?.trim()) return "Please confirm the password";
  if (requirePasswordConfirmation && form.password !== form.passwordConfirm) return "Passwords do not match";
  return "";
}

export function validateCustomerAppointment({ vehicleId, date, time, minDate = "" }) {
  if (!vehicleId) return "Please select a vehicle";
  if (!date) return "Please select a date";
  if (minDate && date < minDate) return `Please choose a date on or after ${minDate}`;
  if (!time) return "Please select a time";

  const appointmentDateTime = buildAppointmentDateTime(date, time);
  if (!appointmentDateTime || Number.isNaN(appointmentDateTime.getTime())) {
    return "Please select a valid appointment date and time";
  }

  if (appointmentDateTime <= new Date()) {
    return "Please select a future time slot";
  }

  return "";
}

export function buildAppointmentDateTime(date, time) {
  if (!date || !time) return null;
  return new Date(`${date}T${time}:00`);
}

export function isWorkingHours(time) {
  if (!time) return false;
  const [hours, minutes] = time.split(":").map(Number);
  return minutes === 0 && hours >= 9 && hours < 17;
}

export function validateInternalAppointment(appointment) {
  const appointmentDateTime = buildAppointmentDateTime(appointment.date, appointment.time);

  if (!appointment.lead || !appointment.vehicle || !appointment.date || !appointment.time) {
    return "Please complete all required appointment details";
  }

  if (!appointmentDateTime || Number.isNaN(appointmentDateTime.getTime())) {
    return "Please enter a valid appointment date and time";
  }

  if (appointmentDateTime <= new Date()) {
    return "Appointments can only be created for future dates and times";
  }

  if (!isWorkingHours(appointment.time)) {
    return "Appointments must be scheduled between 9:00 AM and 5:00 PM";
  }

  return "";
}
