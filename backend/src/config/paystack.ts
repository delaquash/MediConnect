import { Paystack } from 'paystack-api';
import dotenv from 'dotenv';

dotenv.config();

const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY!);

export default paystack;