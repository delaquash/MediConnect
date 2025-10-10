import {
  createFileRoute,
  //  useParams 
} from '@tanstack/react-router'
import { doctors } from '../../assets/assets';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom'
import Footer from '../../components/Footer';

export const Route = createFileRoute('/doctors/')({
  component: Doctors,
})

function Doctors() {
  const { speciality } = useParams()
  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  return (
    <div className='mt-10'>
      <p className='text-xl text-[#4B5563] font-medium'>Browse through the doctos specialist</p>
      <div className='flex items-start sm:flex-row gap-8 mt-5'>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`bg-red-950 border rounded text-sm py-1 transition-all sm:hidden ${showFilter ? "bg-[#5F6FFF] text-white" : ""}`}
        >
          Filter
        </button>
        <div className={`flex flex-col gap-4 w-1/4 text-sm text-[#4B5563] ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
          <p className={`w-[94vw] sm:w-auto pl-3  py-2 pr-16 border border-gray-300 rounded transition-all cursor-pointer${speciality === "General Physician" ? "bg-[#E2E5FF] text-black" : ""}`}>General Physician</p>
          <p className={`w-[94vw] sm:w-auto pl-3  py-2 pr-16 border border-gray-300 rounded transition-all cursor-pointer${speciality === "Gynecologist" ? "bg-[#E2E5FF] text-black" : ""}`}>Gynecologist</p>
          <p className={`w-[94vw] sm:w-auto pl-3  py-2 pr-16 border border-gray-300 rounded transition-all cursor-pointer${speciality === "Dermatologist" ? "bg-[#E2E5FF] text-black" : ""}`}>Dermatologist</p>
          <p className={`w-[94vw] sm:w-auto pl-3  py-2 pr-16 border border-gray-300 rounded transition-all cursor-pointer${speciality === "Paediatrician" ? "bg-[#E2E5FF] text-black" : ""}`}>Paediatrician</p>
          <p className={`w-[94vw] sm:w-auto pl-3  py-2 pr-16 border border-gray-300 rounded transition-all cursor-pointer${speciality === "Neurologist" ? "bg-[#E2E5FF] text-black" : ""}`}>Neurologist</p>
          <p className={`w-[94vw] sm:w-auto pl-3  py-2 pr-16 border border-gray-300 rounded transition-all cursor-pointer${speciality === "Gastroenterologist" ? "bg-[#E2E5FF] text-black" : ""}`}>Gastroenterologist</p>
        </div>
          <div className='grid grid-cols-4 gap-y-6  gap-6  w-3/4'>
            {doctors.map((doctor, index) => (
              <div onClick={() => {
                // navigate({
                //   to: '/doctors/$speciality',
                //   params: { speciality: docId.toString() }

                // });

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
        

      </div>
      <Footer />
    </div>
  )

}
