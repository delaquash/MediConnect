import { createFileRoute } from '@tanstack/react-router'
import { assets } from '../assets/assets'

export const Route = createFileRoute('/contact')({
  component: Contact,
})

function Contact() {
  return <div>
    <div className='text-center text-2xl pt-10 text-[#707070]'>
        <p>CONTACT <span className='text-gray-700 font-semibold'>US</span></p>
      </div>
      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mt-5 mb-28 text-sm'>
        <img src={assets.contact_image} className='w-full md:max-w-[360px]' alt="" />
         <div className='flex flex-col justify-center items-start gap-6'>
          <p className=' font-semibold text-lg text-gray-600'>OUR OFFICE</p>
          <p className=' text-gray-500'>21 Adeola Ajose Boulevard, Off Ikoyi Axis, Lagos Nigeria</p>
          <p className=' text-gray-500'>Tel: (+234) 8064965574 <br /> Email: enquiries@medikonnect.com</p>
          <p className=' font-semibold text-lg text-gray-600'>CAREERS AT MEDIKONNECT</p>
          <p className=' text-gray-500'>Learn more about our teams and job openings.</p>
          <button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500'>Explore Jobs</button>
        </div>
      </div>
    </div>
}
