import  { useState } from 'react'
import { assets } from '../assets/assets'
import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useAppContext, useUserProfile } from '../context/AppContext'
// import { useQueryClient } from '@tanstack/react-query';
const Navbar = () => {
  const navigate = useNavigate()
    const location = useLocation()
    const [showMenu, setShowMenu] = useState(false)
  // Navigation items
  const navItems = [
    { path: '/', label: 'HOME' },
    { path: '/doctors', label: 'ALL DOCTORS' },
    { path: '/about', label: 'ABOUT' },
    { path: '/contact', label: 'CONTACT' }
  ]
  return (
    <nav className="!flex !items-center !justify-between !text-sm !py-4 !mb-5 !border-b !border-b-[#ADADAD]">
      {/* logo */}
      <img 
        className='w-44 cursor-pointer' 
        src={assets.logo}
        alt="Logo"
      />

      {/* <div> */}
        <ul className='md:flex items-start gap-5 font-medium hidden'>
         {navItems.map((nav, index:number)=>(
          <Link
            key={index}
            to={nav.path}
            className="[&.active]:text-primary"
          >
            <li className='!py-1'> {nav.label}</li>
          </Link>
         ))}
        </ul>
      {/* </div> */}

      <div className='flex items-center gap-4 '>
         <button 
            onClick={() => navigate({ to: '/login' })} 
            className='!bg-[#5F6FFF] !text-white !px-8 !py-3 !rounded-full !font-bold !text-xl hidden md:block !transition-colors'
          >
            Create account
          </button>
      </div>
    </nav>
  )
}

export default Navbar
