import  { useEffect, useRef, useState } from 'react'
import { assets } from '../assets/assets'
import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useAppContext, useUserProfile } from '../context/AppContext'
// import { useQueryClient } from '@tanstack/react-query';
const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, logout } = useAppContext()
  const  { data: user, isLoading } = useUserProfile()

  
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
  const dropDownMenuRef = useRef<HTMLDivElement>(null)
  useEffect(()=> {
    const handleClickOutside = (e:MouseEvent) => {
      if(dropDownMenuRef.current && !dropDownMenuRef.current.contains(e.target as Node)){
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
  }, [])

    return (
      <nav className="flex flex-wrap items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]">
      {/* logo */}
      <img
        onClick={() => navigate({ to: "/" })}
        className="w-44 cursor-pointer"
        src={assets.logo}
        alt="Logo"
      />

      <ul className="md:flex items-start gap-5 font-medium hidden">
        {navItems.map((nav, index: number) => (
          <Link
            key={index}
            to={nav.path}
            className="[&.active]:text-[#0b59c5] group relative"
          >
            <li className="py-1">{nav.label}</li>
            <span
              className={`absolute left-0 bottom-0 h-[2px] w-full bg-blue-600 transition-transform duration-300 
          ${isActiveLink(nav.path) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
            />
          </Link>
        ))}
      </ul>

      <div className="flex items-center gap-4 ">
        {token && user ? (
          <div className="flex items-center gap-2 group relative">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse " />
            ) : (
              <img
                src={
                  user?.image ||
                  "https://res.cloudinary.com/delaquarsh/image/upload/v1718717616/w1wushxqt2aorazppexq.jpg"
                }
                className="w-8 rounded-full"
                alt="User Image"
              />
            )}

            {/* Dropdown toggle (image as button) */}
            <div className="relative" 
            // ref={menuRef}
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
