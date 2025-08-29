import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  // const {}  = useContext
  return (
        <form className='!mx-auto !mb-[90px] !mt-[40px] !shadow-lg !w-[450px] !h- !bg-white !rounded-[20px] !border !border-[#D4D4D4] !p-8'>
          <div className="!ml-[4px] !flex !flex-col !items-start !gap-2">
            <p className="!text-xl">Login</p>
            <p className="!text-xl !text-[#4B5563]">Please login to book an appointment</p>
            <div className='!flex !gap-2  !flex-col !items-start '>
              
              <p className="  text-xl !text-[#4B5563]">Email</p>
              <input className='!w-[385px] !h-[45px] !text-xl outline-0  !pb-1 !pl-4 !font-medium  !border-[#DADADA] !border-2 !rounded' type='email' required/>
               <p className=" text-xl !text-[#4B5563]">Password</p>
              <input className='!w-[385px] outline-0 !h-[45px] !text-xl !pb-1 !pl-4 !font-medium  !border-[#DADADA] !border-2 !rounded' type='password' required/>
             
            </div>
            <div>
              <button
              className='!bg-[#5F6FFF] outline-0 !p-[12px] !text-xl !rounded !border-[6] !mt-[11px] w-[385px] !text-white !items-center !justify-center'
              >
                Login
              </button>  
          </div> 
          <p className='!mt-[11px] text-xl text-[#4B5563] font-semibold' >Don't have an account? 
                <Link
                  to='/register'
                  className='!ml-[6px] !text-[#5F6FFF] !underline !cursor-pointer text-xl'
                >Sign Up</Link> 
            </p>
          </div>
        </form>
  )
}