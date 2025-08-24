import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { assets, doctors, specialityData } from '../assets/assets';
export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
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
           {specialityData.map((speciality, index)=> (
            <div
              className='flex-row'
              key={index}
            >
              <img 
                src ={speciality.image} 
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
                    <div onClick={() => { navigate(`/appointment/${docId}`); scrollTo(0, 0) }} 
                      key={index}
                      className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:transalte-y-[-10px] transition-all duration-500'
                    >
                        <img className='bg-[#EAEFFF]' src={doctor.image} alt="" />
                        <div className='p-4'>
                          <div className={`flex items-center gap-2 text-sm text-center ${doctor.available ? "text-green-500": "text-gray-500"}`}>
                            <p className={`w-2 h-2 rounded-full ${doctor.available ? " bg-green-500" : "bg-gray-500"}`}></p>
                            <p>{doctor.available ? "Available" : "Not Available"}</p>
                          </div>
                            <p className="text-[#262626] text-lg font-medium">{doctor.name}</p>
                            <p className='text-[#5C5C5C] text-sm'>{doctor.speciality}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={() => { navigate('/doctors'); scrollTo(0, 0) }} className='bg-[#EAEFFF] text-gray-600 px-12 py-3 rounded-full mt-10'>more</button>
        </div>
      </div>
      {/* Homepage Banner */}

      {/* Footer */}
    </>
  )
}
