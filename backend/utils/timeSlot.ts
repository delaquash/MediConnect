
// Generate time slots (e.g., 9:00 AM to 5:00 PM, 30-minute intervals)
export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];              // Initialize empty array to store time slots
  
  // Outer loop: iterate through hours from 9 AM to 4 PM (17 is exclusive)
  for (let hour = 9; hour < 17; hour++) {
    // Inner loop: create 30-minute intervals (0 and 30 minutes)
    for (let minute = 0; minute < 60; minute += 30) {
      // Format time as "HH:MM" with leading zeros if needed
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);              // Add formatted time to slots array
    }
  }
  return slots; 
}
// This generates: ["09:00", "09:30", "10:00", "10:30", ..., "16:00", "16:30"]