// Check if date is valid (not in the past, within reasonable future limit)
const isValidAppointmentDate = (dateString: string): boolean => {
  const appointmentDate = new Date(dateString);  // Convert string to Date object
  const today = new Date();                      // Get current date
  const maxFutureDate = new Date();              // Create date object for future limit
  
  // Set maximum booking date to 3 months in the future
  maxFutureDate.setMonth(maxFutureDate.getMonth() + 3);
  
  // Reset time components to start of day (00:00:00) for accurate date-only comparison
  today.setHours(0, 0, 0, 0);              // Today at midnight
  appointmentDate.setHours(0, 0, 0, 0);    // Appointment date at midnight
  
  // Return true if appointment date is today or future, but within 3-month limit
  return appointmentDate >= today && appointmentDate <= maxFutureDate;
};