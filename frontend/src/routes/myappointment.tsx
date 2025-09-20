import { createFileRoute } from '@tanstack/react-router'
import { useAppContext, useBookAppointment } from '../context/AppContext'
import { getUserAppointment } from '../hooks/UserHooks'


export const Route = createFileRoute('/myappointment')({
  component: RouteComponent,
})



function RouteComponent() {
  const { backendUrl, token } = useAppContext()
const { data: response, isPending, error } = getUserAppointment()

// const appointments = response?.userAppointment;

  // console.log(response)
  return (
      <div>
        <p className='pb-3 mt-40 text-lg font-medium text-[#4B5563]'>My Appointments</p>
        <hr className='border-[#D1D1D1] border-2'/>
        <div className=''>
          {response?.map((details: any, index: number)=>(
            <div
              key={index} 
              className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b'
            >
              <div>
                <img className='w-36 bg-[#EAEFF]' src={details.image} alt=''/>
              </div>
              <div className='flex-1 text-sm text-[#5E5E5E]'>
                <p className='text-[#262626] font-medium text-base'>{details.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
  )

}
