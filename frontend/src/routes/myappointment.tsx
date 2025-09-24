import { createFileRoute } from '@tanstack/react-router'
import { useAppContext, useBookAppointment } from '../context/AppContext'
import { getUserAppointment } from '../hooks/UserHooks'

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
                <img className='w-36 bg-[#EAEFF]' src={details?.userData?.image} alt=''/>
              </div>
              <div className='flex-1 text-sm text-[#5E5E5E] m-2'>
                <p className='text-[#262626] font-medium text-base'>{details?.userData?.name}</p>
                <p className='pt-4'>{details?.userData?.specialty}</p>
                <p className='text-[#464646] font-medium mt-1'>Address:</p>
                <p className=''>{details?.userData?.address.line1}</p>
                <p className=''>{details?.userData?.address.line2}</p>
                <p className=' mt-1'><span className='text-sm text-[#3C3C3C] font-medium'>Date & Time:</span> {details?.slotDate} |  {details?.slotTime}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
  )

}
