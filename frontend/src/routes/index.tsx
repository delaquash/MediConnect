import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { assets, doctors, specialityData } from '../assets/assets';
export const Route = createFileRoute('/')({
  component: Home,
})

function Home({ docId }: any) {
  const navigate = useNavigate()
  return (
    <>
      <div className='flex flex-col md:flex-row flex-wrap bg-[#5F6FFF] rounded-lg px-6 md:px-10 lg:px-20 '>

        {/* --------- Header Left --------- */}
        <div className='md:w-1/2 flex flex-col items-start justify-center gap-4 py-10 m-auto md:py-[10vw] md:mb-[-30px]'>
          <p className='text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight'>
            Book Appointment <br />  With Trusted Doctors
          </p>
          <div className='flex flex-col md:flex-row items-center gap-3 text-white text-sm font-light'>
            <img className='w-28' src={assets.group_profiles} alt="" />
            <p>Simply browse through our extensive list of trusted doctors, <br className='hidden sm:block' /> schedule your appointment hassle-free.</p>
          </div>
          <a href='#speciality' className='flex items-center gap-2 bg-white px-8 py-3 rounded-full text-[#595959] text-sm m-auto md:m-0 hover:scale-105 transition-all duration-300'>
            Book appointment <img className='w-3' src={assets.arrow_icon} alt="" />
          </a>
        </div>

        {/* --------- Header Right --------- */}
        <div className='md:w-1/2 relative'>
          <img className='w-full md:absolute bottom-0 h-auto rounded-lg' src={assets.header_img} alt="" />
        </div>
      </div>
      {/* Find By Specialty */}
      <div className="flex flex-col justify-center gap-4 items-center m-20 text-xl">
        <p className="text-[#1F2937]">Find by Speciality</p>
        <p className='text-[#4B5563] text-center '>Simply browse through our extensive list of trusted doctors, schedule <br /> <span>your appointment halse-free.</span></p>



        <div className='flex gap-4 justify-center py-10  items-center'>
          {specialityData.map((speciality, index) => (
            <div
              className='flex-row'
              key={index}
            >
              <img
                src={speciality.image}
                width={100}
                height={100}
                alt='Speciality'
              />

              <p className='text-center text-[18px] text-[#4B5563]'>{speciality.speciality}</p>
            </div>
          ))}
        </div>
        {/* Top Doctors to ask */}
        <div className='flex flex-col items-center gap-4 my-16 text-[#262626] md:mx-10'>
          <h1 className='text-3xl font-medium'>Top Doctors to Book</h1>
          <p className='sm:w-1/3 mb-10 text-center text-sm'>Simply browse through our extensive list of trusted doctors.</p>
          <div className='grid grid-cols-5 w-full gap-4 px-2 sm:px-0 gap-y-6'>
            {doctors.slice(0, 10).map((doctor, index) => (
              <div onClick={() => {
                navigate({
                  to: '/doctors/$speciality',
                  params: { speciality: docId.toString() }

                });

                scrollTo(0, 0)
              }}
                key={index}
                className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:transalte-y-[-10px] transition-all duration-500'
              >
                <img className='bg-[#EAEFFF]' src={doctor.image} alt="" />
                <div className='p-4'>
                  <div className={`flex items-center gap-2 text-sm text-center ${doctor.available ? "text-green-500" : "text-gray-500"}`}>
                    <p className={`w-2 h-2 rounded-full ${doctor.available ? " bg-green-500" : "bg-gray-500"}`}></p>
                    <p>{doctor.available ? "Available" : "Not Available"}</p>
                  </div>
                  <p className="text-[#262626] text-lg font-medium">{doctor.name}</p>
                  <p className='text-[#5C5C5C] text-sm'>{doctor.speciality}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              navigate({ to: '/doctors' });
              scrollTo(0, 0);
            }}
            className='bg-[#EAEFFF] cursor-pointer text-gray-600 px-12 py-3 rounded-full mt-10'>
            more
          </button>
        </div>
        {/* Homepage Banner */}
        <div className='bg-[#5F6FFF] rounded-lg flex px-6 sm:px-10 lg:px-12 my-20 md:mx-10 '>
          {/* Right side */}
          <div className='flex-1 py-8 sm:py-10 md:py-16 lg:py-24 lg:pl-5'>
            <div className="className='!text-white sm:text-2xl md:text-3xl lg:text-5xl font-semibold text-xl">
              <p>Book Appointment</p>
              <p className='!mt-4'> With 100+ Trusted Doctors</p>
            </div>

            <button
              onClick={() => {
                navigate({ to: '/register' });
                scrollTo(0, 0);
              }}

              className='bg-white text-sm sm:text-base cursor-pointer text-[#595959] px-8 py-3 rounded-full mt-6 hover:scale-105 transition-all '
            >
              Create account
            </button>
          </div>
          <div className='hidden md:block md:w-1/2 lg:w-[370px] relative'>
            <img
              className='w-full absolute bottom-0 right-0 max-w-md'
              src={assets.appointment_img}
              alt=""
            />
          </div>
        </div>
        {/* Footer */}
        <div className='md:mx-10'>
          <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10  mt-40 text-sm'>
            <div className=''>
              <img
                onClick={() => {
                  navigate({ to: '/' })
                }}
                className='mb-10 w-44 cursor-pointer'
                src={assets.logo}
                alt="Logo"
              />
              <p className='w-full md:w-2/3 text-gray-600 leading-6'>
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
                <li>vasuparashar18@gmail.com</li>
              </ul>
            </div>
          </div>
        </div>
      </div>


      {/* Footer */}
    </>
  )
}
