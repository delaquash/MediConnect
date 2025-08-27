import { createFileRoute } from '@tanstack/react-router'
import { assets } from '../assets/assets'

export const Route = createFileRoute('/appointments')({
  component: Appointment,
})

function Appointment() {
  return (
    <>
      <div>
        <div className="flex sm:flex-row gap-4 mt-10">
          <div>
            <img
              src={assets.doc_image}
              alt=""
              className='bg-[#5F6FFF] border-0 object-cover rounded-lg w-full outline-none sm:max-w-72'
            />
          </div>
          <div className='flex-1 border border-[#ADADAD] rounded-lg bg-white p-8 px-7 mx-2 sm:mx-0 mt-[-90px] sm:mt-0 '>
            <p className='flex font-medium items-center gap-2 text-2xl text-gray-700'>
              Dr. Richard James
              <img
                src={assets.verified_icon}
                alt=''
              />
            </p>
            <p className='flex items-center gap-2 mt-1 text-gray-600'>
              MBBS - General Physician
              <span className='bg-white border border-[#4B5563] rounded-full p-3'> 2 years</span>
            </p>
            <div>
              <p className='flex items-center gap-1 text-sm font-medium text-[#262626] mt-3'>About <img className='w-3' src={assets.info_icon} alt="" /></p>
              <p className='text-sm text-gray-600 max-w-[700px] mt-1'>
                Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective
                treatment strategies.
              </p>
            </div>

            <p className='text-gray-600 font-medium mt-4'>Appointment fee: <span className='text-gray-800'>#70,000</span> </p>
          </div>
        </div>
      </div>
      {/* Booking slot */}
      <div className='sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656] text-2xl'>
        <p>Booking Slot</p>
        <div className="">
          
        </div>
      </div>
    </>
  )
}
