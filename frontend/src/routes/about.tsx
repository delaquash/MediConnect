import { createFileRoute } from '@tanstack/react-router'
import { assets } from '../assets/assets'
import Footer from '../components/Footer'

export const Route = createFileRoute('/about')({
component: About,
})

function About() {
  return (
    <div className='mt-10'>
      <p className='text-center text-[#4B5563] font-medium text-2xl'>ABOUT <span className='text-[#1F2937] font-bold'> US </span></p>
      <div className='flex flex-row gap-8 mt-5 text-xl text-[#4B5563]'>
        <div className='w-1/4'>
          <img 
            src={assets.about_us}

            
          />
        </div>
        <div className='w-3/4'>
          <p className='items-center justify-start'>
            Welcome to Medikonnect, your trusted partner in managing your healthcare needs conveniently and efficiently. 
            At Medikonnect, we understand the challenges individuals face when it comes to scheduling doctor appointments and managing their health records.
            <br/>
            <br/>
            Medikonnect is committed to excellence in healthcare technology. We continuously strive to enhance our platform, integrating the latest advancements to improve user experience and deliver superior service. Whether you're booking your first appointment or managing ongoing care, Medikonnect is here to support you every step of the way.
            <br/>
            <br/>
            <span className='text-xl font-bold line-clamp-5'>Our Vision</span>
            <br />
            Our vision at Medikonnect is to create a seamless healthcare experience for every user. We aim to bridge the gap between patients and healthcare providers, making it easier for you to access the care you need, when you need it.
          </p>
        </div>
      </div>
      <div className='mt-10'>
        <p className='text-xl'>WHY <span className='font-semibold  text-[#1F2937]'>CHOOSE US</span></p>
      </div>
      <div className="flex flex-col md:flex-row mb-20">
        <div className="border px-10 md:px-10 py-8 flex flex-col gap-5 text-[15px] transition-all duration-300 text-gray-600 cursor-pointer">
          <b>EFFICIENCY:</b>
          <p>Streamlined appointment scheduling that fits into your busy lifestyle.</p>
        </div>
        <div className="border px-10 md:px-10 py-8 flex flex-col gap-5 text-[15px] transition-all duration-300 text-gray-600 cursor-pointer">
          <b>Convenience::</b>
          <p>Streamlined appointment scheduling that fits into your busy lifestyle.</p>
        </div>
        <div className="border px-10 md:px-10 py-8 flex flex-col gap-5 text-[15px] transition-all duration-300 text-gray-600 cursor-pointer">
          <b>EFFICIENCY:</b>
          <p>Streamlined appointment scheduling that fits into your busy lifestyle.</p>
        </div>
      </div>
      <Footer/>
    </div>
  )
}
