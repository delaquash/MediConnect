import  { useEffect, useRef, useState } from 'react'
import { assets } from '../assets/assets'
import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useAppContext } from '../context/AppContext'
import { useUserProfile } from '../hooks/UserHooks'

// import { useQueryClient } from '@tanstack/react-query';
const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, logout } = useAppContext()
  const  { data: user, isLoading } = useUserProfile()
  const dropDownMenuRef = useRef<HTMLDivElement>(null)
  
    const navItems = [
    { path: '/', label: 'HOME' },
    { path: '/doctors', label: 'ALL DOCTORS' },
    { path: '/about', label: 'ABOUT' },
    { path: '/contact', label: 'CONTACT' }
  ]

  const isActiveLink = (path: string) => {
    return location.pathname === path
  }

  const handleLogout = () => {
    logout()
    setToken("")
  }
  return (
    <nav className=" flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]">
      {/* logo */}
      <img
        onClick={() => navigate({ to: "/" })}
        className="w-44 cursor-pointer"
        src={assets.logo}
        alt="Logo"
      />

      {/* <div> */}
        <ul className='!md:flex !items-start !gap-5 !font-medium'>
         {navItems.map((nav, index:number)=>(
          <Link
            key={index}
            to={nav.path}
            className="[&.active]:text-[#1F2937]"
          >
            <li className='py-1'> {nav.label}</li>
            <hr 
              className={`border-none outline-none bg-blue-600 w-full m-auto transition-opacity ${
                isActiveLink(nav.path) ? 'opacity-100' : 'opacity-0'
              }`} 
            />
          </Link>
        ))}
      </ul>

      <div className='flex items-center gap-4 '>
        {/* if account exist, token is stored and with token user should see something different */}
         {token && userData ? 
          ( 
            <div className='flex items-center gap-2 cursor-pointer group relative '>
              { isLoading  ? 
              (
                <div className='w-8 h-8 rounded-full bg-gray-200 animate-pulse '/>
              ) :
              (
                <img 
                  src={userData?.image }
                  className='w-8 rounded-full'
                  alt='User Image'
                />
              )
            }
            <img  className='w-2.5' alt='Dropdown' src={assets.dropdown_icon}  />

            {/* Dropdown toggle (image as button) */}
            <div className="relative" 
            ref={dropDownMenuRef}
            >
              <img
                src={assets.dropdown_icon}
                alt="Dropdown"
                className="w-6 h-6 cursor-pointer"
                onClick={() => setShowMenu((prev) => !prev)}
              />

              {/* Dropdown menu */}
              {showMenu && (
                <div className="absolute top-12 right-0 text-base font-medium text-gray-600 z-20">
                  <div className="min-w-48 bg-[#F8F8F8] flex flex-col rounded-xl font-bold text-[#4B5563] gap-4 p-4 shadow-lg">
                    <Link
                      className="hover:text-black cursor-pointer transition-colors"
                      to="/myprofile"
                    >
                      My Profile
                    </Link>
                    <Link
                      className="hover:text-black cursor-pointer transition-colors"
                      to="/myappointment"
                    >
                      My Appointment
                    </Link>
                    <p
                      className="hover:text-black cursor-pointer transition-colors"
                      onClick={handleLogout}
                    >
                      Logout
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate({ to: "/register" })}
            className="bg-[#5F6FFF] text-white cursor-pointer px-8 py-3 rounded-full font-bold text-xl hidden md:block transition-colors"
          >
            Create account
          </button>
        )}
      </div>
      </nav>
    )
};


export default Navbar
