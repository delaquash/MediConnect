import React, { useState } from 'react'
import { assets } from '../assets/assets'
import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useAppContext, useUserProfile } from '../context/AppContext'
// import { useQueryClient } from '@tanstack/react-query';

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const { token, logout } = useAppContext()
  
  // Use TanStack Query for user data
  const { data: userData, isLoading } = useUserProfile()

  const handleLogout = () => {
    logout()
    // queryClient.clear();
    navigate({ to: '/login' })
  }

//   const logout = () => {
//   setToken('');
//   // Clear all cached queries on logout
//   queryClient.clear();
// };

  // Helper function to check if link is active
  const isActiveLink = (path: string) => {
    return location.pathname === path
  }

  // Navigation items
  const navItems = [
    { path: '/', label: 'HOME' },
    { path: '/doctors', label: 'ALL DOCTORS' },
    { path: '/about', label: 'ABOUT' },
    { path: '/contact', label: 'CONTACT' }
  ]

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]'>
      {/* Logo */}
      <img 
        onClick={() => navigate({ to: '/' })} 
        className='w-44 cursor-pointer' 
        src={assets.logo} 
        alt="Logo" 
      />

      {/* Desktop Navigation */}
      <ul className='md:flex items-start gap-5 font-medium hidden'>
        {navItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            className="[&.active]:text-primary"
          >
            <li className='py-1'>{item.label}</li>
            <hr 
              className={`border-none outline-none h-0.5 bg-primary w-3/5 m-auto transition-opacity ${
                isActiveLink(item.path) ? 'opacity-100' : 'opacity-0'
              }`} 
            />
          </Link>
        ))}
      </ul>

      {/* User Actions */}
      <div className='flex items-center gap-4'>
        {token && userData ? (
          <div className='flex items-center gap-2 cursor-pointer group relative'>
            {/* Show loading state or user image */}
            {isLoading ? (
              <div className='w-8 h-8 rounded-full bg-gray-200 animate-pulse' />
            ) : (
              <img 
                className='w-8 rounded-full' 
                // src={userData?.image? userData.image : assets.default_avatar} 
                alt="User Avatar" 
              />
            )}
            <img className='w-2.5' src={assets.dropdown_icon} alt="Dropdown" />
            
            {/* Dropdown Menu */}
            <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
              <div className='min-w-48 bg-gray-50 rounded flex flex-col gap-4 p-4 shadow-lg'>
                <Link 
                  to='/myprofile' 
                  className='hover:text-black cursor-pointer transition-colors'
                >
                  My Profile
                </Link>
                <Link 
                  to='/myappointment' 
                  className='hover:text-black cursor-pointer transition-colors'
                >
                  My Appointments
                </Link>
                <p 
                  onClick={handleLogout} 
                  className='hover:text-black cursor-pointer transition-colors'
                >
                  Logout
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => navigate({ to: '/login' })} 
            className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block hover:bg-primary-dark transition-colors'
          >
            Create account
          </button>
        )}

        {/* Mobile Menu Button */}
        <img 
          onClick={() => setShowMenu(true)} 
          className='w-6 md:hidden cursor-pointer' 
          src={assets.menu_icon} 
          alt="Menu" 
        />

        {/* Mobile Menu */}
        <div className={`md:hidden ${showMenu ? 'fixed w-full' : 'h-0 w-0'} right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all duration-300`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img src={assets.logo} className='w-36' alt="Logo" />
            <img 
              onClick={() => setShowMenu(false)} 
              src={assets.cross_icon} 
              className='w-7 cursor-pointer' 
              alt="Close" 
            />
          </div>
          
          {/* Mobile Navigation Items */}
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                onClick={() => setShowMenu(false)}
                className={`px-4 py-2 rounded-full inline-block transition-colors ${
                  isActiveLink(item.path) ? 'bg-primary text-white' : 'hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Mobile Login/Logout */}
            {token && userData ? (
              <div className='mt-4 flex flex-col gap-2 w-full'>
                <Link 
                  to='/myprofile'
                  onClick={() => setShowMenu(false)}
                  className='px-4 py-2 rounded-full text-center hover:bg-gray-100 transition-colors'
                >
                  My Profile
                </Link>
                <Link 
                  to='/myappointment'
                  onClick={() => setShowMenu(false)}
                  className='px-4 py-2 rounded-full text-center hover:bg-gray-100 transition-colors'
                >
                  My Appointments
                </Link>
                <button 
                  onClick={() => {
                    setShowMenu(false)
                    handleLogout()
                  }}
                  className='px-4 py-2 rounded-full hover:bg-gray-100 transition-colors'
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setShowMenu(false)
                  navigate({ to: '/login' })
                }}
                className='bg-primary text-white px-8 py-3 rounded-full font-light mt-4 hover:bg-primary-dark transition-colors'
              >
                Create account
              </button>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar