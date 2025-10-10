import { doctors } from '../assets/assets'
import Footer from './Footer';

const RelatedDoctors = () => {
  return (
    <div className='flex flex-col my-6 items-center gap-4 text-[#262626]'>
        <h2 className='text-2xl font-medium'>Related Doctors</h2>
        <p className='text-center font-medium sm:text-sm'>Simply browse through our extensive list of trusted doctors</p>
        <div className='w-full grid grid-cols-4 gap-9 px-2 gap-y-6'>
           {doctors.slice(0, 4).map((doc, _index)=> (
                <div 
                 key={doc._id}
                 className='border border-[#C9DBFF] rounded-xl overflow-hidden cursor-pointer hover:transalte-y-[-10px] transition-all duration-500'
                >
                    <img className='bg-[#EAEFFF]' src={doc.image} alt="" />
                    <div className="p-4">
                        <div className={`flex items-center gap-4 text-sm text-center ${doc.available} ? "text-green-500":"text-gray-500"`}>
                            <p className={`w-2 h-2 rounded-full ${doc.available ? " bg-green-500" : "bg-gray-500"}`}></p>
                         <p>{doc.available ? "Available" : "Not Available"}</p>
                  </div>
                  <p className="text-[#262626] mt-2 text-lg font-medium">{doc.name}</p>
                  <p className='text-[#5C5C5C] mt-2 text-sm'>{doc.speciality}</p>
                    </div>
                </div>
           ))}
        </div>       
      <div className='mt-20'>
        <Footer />
      </div>
    </div>
  )
}

export default RelatedDoctors;
