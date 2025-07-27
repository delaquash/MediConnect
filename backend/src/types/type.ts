interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

export interface PopulatedAppointment {
  _id: string;
  userId: PopulatedUser;
  userData: {
    name: string;
    phone: string;
    address: any;
  };
  docData: any;
  slotDate: string;
  slotTime: string;
  amount: number;
  isCompleted: boolean;
  payment: boolean;
  cancelled: boolean;
  date: number;
}