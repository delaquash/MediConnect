import { createFileRoute, useParams } from '@tanstack/react-router'
import { assets } from '../assets/assets'
import { useState } from 'react'
import RelatedDoctors from '../components/RelatedDoctors'

export const Route = createFileRoute('/appointments')({
  component: Appointment,
})

function Appointment() {
  // const { docId } = useParams()
  // const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const [docInfo, setDocInfo] = useState(false)
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')

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
     
      {/* Booking slot */}
      <div className='sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656] text-2xl'>
        <p>Booking Slot</p>
        <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
          {docSlots.length && docSlots.map((doc, index) => (
            <div
              key={index}
              className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? "bg-[#5F6FFF] text-white" : "border border-[#DDDDDD]"}`}>
              {/* <p>{doc[0] && daysOfWeek[doc[0].datetime?.getDay()]}</p>
                <p>{doc[0] && doc[0].datetime?.getDate()}</p> */}
            </div>
          ))}
        </div>

        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {docSlots.length && docSlots[slotIndex].map((item, index) => (
            <p onClick={() => setSlotTime(item.time)} key={index} className={`text-sm font-light  flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-[#949494] border border-[#B4B4B4]'}`}>{item.time.toLowerCase()}</p>
          ))}
          </div>

          <button className='bg-primary text-white text-sm font-light px-20 py-3 rounded-full my-6'>Book an appointment</button>
        </div>
      </div> 
      {/* </div> */}
      <div>
        <RelatedDoctors />
      </div>
    </>
  )
}
