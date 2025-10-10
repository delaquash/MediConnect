import { createFileRoute } from '@tanstack/react-router'
import { useAppContext, useBookAppointment } from '../context/AppContext'
import { getUserAppointment } from '../hooks/UserHooks'
import { assets } from '../assets/assets'

export const Route = createFileRoute('/myappointment')({
  component: RouteComponent,
})

function RouteComponent() {
const { backendUrl, token } = useAppContext()
const { data: response, isPending, error } = getUserAppointment()

console.log(response)
if (isPending) {
  console.log('Query is still loading...');
  return <div>Loading appointments...</div>;
}

if (error) {
  console.log('Query failed with error:', error);
  return <div>Error loading appointments: {error.message}</div>;
}


    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate: string) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }
  return (
      <div>
        <p className='pb-3 mt-40 text-lg font-medium text-[#4B5563]'>My Appointments</p>
        <hr className='border-[#D1D1D1] border-2'/>
        <div className=''>
          {response?.map((details: any, index: number)=>(
            <div
              key={index} 
              className='grid grid-cols-[1fr_2fr] sm:flex sm:gap-6 py-4 border-b border-[#D1D1D1]'
            >
              <div>
                <img className='w-36 bg-[#EAEFF]' src={details?.docData?.image} alt=''/>
              </div>
              <div className='flex-1 text-sm text-[#5E5E5E] m-2'>
                <p className='text-[#262626] font-medium text-base'>{details?.docData?.name}</p>
                <p className=''>{details?.docData?.specialty}</p>
                <p className='text-[#464646] font-medium mt-4'>Address:</p>
                <p className=''>{details?.docData?.address.line1}</p> 
                 <p className=''>{details?.docData?.address.line2}</p>
                <p className=' mt-4'><span className='text-sm text-[#3C3C3C] font-medium'>Date & Time:</span> {details?.slotDate} |  {details?.slotTime}</p>
              </div>
              <div></div>
              <div className='flex flex-col gap-2 justify-end text-sm text-center'>
                            {!details?.cancelled && !details?.payment 
                            // && !details?.isCompleted && payment !== details?._id 
                            && 
                              <button 
                              // onClick={() => setPayment(details?._id)} 
                              className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>Pay Online</button>}
                            {!details?.cancelled && !details?.payment && !details?.isCompleted 
                              // && payment === details?._id 
                            && <button 
                              // onClick={() => appointmentStripe(details?._id)} 
                              className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 hover:text-white transition-all duration-300 flex details?s-center justify-center'><img className='max-w-20 max-h-5' src={assets.stripe_logo} alt="" /></button>}
                            {!details?.cancelled && !details?.payment && !details?.isCompleted 
                              // && payment === details?._id 
                            && 
                            <button 
                            // onClick={() => appointmentRazorpay(details?._id)} 
                            className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 hover:text-white transition-all duration-300 flex details?s-center justify-center'><img className='max-w-20 max-h-5' src={assets.razorpay_logo} alt="" /></button>}
                            {!details?.cancelled && details?.payment && !details?.isCompleted && <button className='sm:min-w-48 py-2 border rounded text-[#696969]  bg-[#EAEFFF]'>Paid</button>}

                            {details?.isCompleted && <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Completed</button>}

                            {!details?.cancelled && !details?.isCompleted && <button 
                            // onClick={() => cancelAppointment(details?._id)} 
                            className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel appointment</button>}
                            {details?.cancelled && !details?.isCompleted && <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appointment cancelled</button>}
                        </div>
            </div>
          ))}
        </div>
      </div>
  )

}
