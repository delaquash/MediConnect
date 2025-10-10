import { IUser } from "../model/UserModel";

export function checkUserProfileCompletion(user: IUser): { isComplete: boolean; missingFields: string[] } {
  const requiredFields = [
    { field: 'name', value: user.name },
    { field: 'email', value: user.email },
    { field: 'phone', value: user.phone },
    { field: 'address', value: user.address },
    { field: 'dob', value: user.dob },
    { field: 'gender', value: user.gender },
    // Add other required fields based on your User schema
  ];

  const missingFields: string[] = [];

  for (const { field, value } of requiredFields) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field);
    }
  }

  // Check if email is verified (important for medical appointments)
  if (!user.isEmailVerified) {
    missingFields.push('emailVerification');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
}