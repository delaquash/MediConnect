import { useNavigate } from "@tanstack/react-router"
import { assets } from "../assets/assets"


const Footer = () => {
  const navigate = useNavigate()
  return (
    <div className='pt-[2px[] md:mx-10 '>
              <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10  mt-40 text-sm'>
                <div className='mb-3'>
                  <img
                    onClick={() => {
                      navigate({ to: '/' })
                    }}
                    className='mb-10 w-44 cursor-pointer'
                    src={assets.logo}
                    alt="Logo"
                  />
                  <p className='w-full mt-9 md:w-2/3 text-gray-600 leading-6'>
                    MediKonnect is a modern healthcare platform that connects patients with doctors, clinics, and wellness services in one place. It makes booking appointments simple, consultations accessible, and medical records easy to manage. With a focus on trust, convenience, and care, MediKonnect bridges the gap between people and the healthcare they need every day.
                  </p>
                </div>
                <div>
                  <p className='text-xl font-medium mb-5'>COMPANY</p>
                  <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>Home</li>
                    <li>About us</li>
                    <li>Delivery</li>
                    <li>Privacy policy</li>
                  </ul>
                </div>
    
                <div>
                  <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                  <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>+91-8468938745</li>
                    <li>support@medikonnect.com</li>
                  </ul>
                </div>
              </div>
              <div>
        <hr />
        <p className='py-5 text-sm text-center'>Copyright 2025 @ Medikonnect.com - All Right Reserved.</p>
      </div>
            </div>
  )
}

export default Footer