const validateProfileData = (data: any, isRequired = false) => {
  const errors: string[] = [];

  // Name validation - check if provided or required
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    } else if (data.name.trim().length > 50) {
      errors.push("Name must be less than 50 characters");
    }
  } else if (isRequired) { // Only required for profile completion
    errors.push("Name is required");
  }
}