import validator from "validator";

export const validateProfileData = (data: any, isRequired = false) => {
  const errors: string[] = [];

  // Name validation - check if provided or required
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    } else if (data.name.trim().length > 50) {
      errors.push("Name must be less than 50 characters");
    }
  } else if (isRequired) { 
    errors.push("Name is required");
  }

  // Phone number validation
  if(data.phone !== undefined) {
    if(!data.phone || !validator.isMobilePhone(data.phone, "any")){
      errors.push("Please provide a mobile phone number")
    }
  } else if(isRequired) {
    errors.push("Phone number is required")
  }

  // Address validation
  if(data.address !== undefined) {
    if(!data.address || !data.address.line1 || data.address.line1.trim().length < 5) {
      errors.push("Address line 1 must be atleast 5 characters long")
    }
  } else if(isRequired) {
    errors.push("Address is required")
  }

  // DOB Validation
  if(data.dob !== undefined){
    if(!data.dob){
      if(isRequired) errors.push("Data is required")
    } else {
      const birthDate = new Date(data.dob)
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      
      // Age must be between 13-70 years for healthcare platform
      if (isNaN(birthDate.getTime()) || age < 13 || age > 70) {
        errors.push("Please provide a valid date of birth (age between 13-120 years)");
      }
    }
  } else if (isRequired) { 
    errors.push("Date of birth is required");
  }
  
  // Gender validation
  if(data.gender !== undefined && data.gender !== null){
    if(!["Male", "Female", "Other"].includes(data.gender)){
      errors.push("Gender must be Male, Female, or Other")
    } 
  }

  // Password Validation
  if(data.password !== undefined) {
    if(!validator.isStrongPassword(data.password, {
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1
    })) {
      errors.push("Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols");
    }

    return errors
  }
}