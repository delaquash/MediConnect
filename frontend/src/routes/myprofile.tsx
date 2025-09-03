import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { updateUserProfile, useUserProfile } from '../hooks/UserHooks';
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

export const Route = createFileRoute('/myprofile')({
  component: MyProfile,
})

function MyProfile() {
  // get user data
  const { data: userProfileData, isLoading: isLoadingUserProfile, error } = useUserProfile()
  const updateProfileMutation = updateUserProfile();
  const [isEdit, setIsEdit] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    address: {
      line1: "",
      line2: ""
    },
    gender: "",
    dob: ""
  })

  const startEdit = () => {
    if (userProfileData) {
      setEditData({
        name: userProfileData.name || "",
        phone: userProfileData.phone || "",
        address: {
          line1: userProfileData.address?.line1 || "",
          line2: userProfileData.address?.line2 || ""
        },
        gender: userProfileData.gender,
        dob: userProfileData.dob
      })
      setIsEdit(true)
    }
  }
  // handle Profile Update
  const handleProfileUpdate = async () => {

    try {    
      console.log("Attempting log")
      const formData = new FormData()
      formData.append('name', editData.name)
      formData.append('phone', editData.phone)
      formData.append('address', JSON.stringify(editData.address))
      formData.append('gender', editData.gender)
      formData.append('dob', editData.dob)

      if (image) {
        formData.append('image', image)
      }

      await updateProfileMutation.mutateAsync(formData)

      // reset state when edit is successfull
      setIsEdit(false)
      setImage(null)

    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  if (isLoadingUserProfile) {
    return (
      <div className="max-w-lg flex flex-col gap-2 text-sm pt-5">
        <div className="w-36 h-36 rounded bg-gray-200 animate-pulse " />
        <div className='h-8 bg-gray-200 animate-pulse rounded mt-4' />
        <div className='h-4 bg-gray-200 animate-pulse rounded' />
      </div>
    )
  }

  if (error) {
    return (
      <div className="ma-w-lg pt-5">
        <p className="text-red-500">Error loading profile: {error.message}</p>
      </div>
    )
  }

  if (!userProfileData) {
    return (
      <div className='max-w-lg pt-5'>
        <p className='text-gray-500'>No profile data available</p>
      </div>
    )
  }
  return (
<div className='max-w-lg flex flex-col gap-2 text-sm pt-5'>
      {/* Profile Image */}
      {isEdit ? (
        <label htmlFor='image'>
          <div className='inline-block relative cursor-pointer'>
            <img 
              className='w-36 rounded opacity-75' 
              src={image ? URL.createObjectURL(image) : userProfileData.image} 
              alt="Profile" 
            />
            <img 
              className='w-10 absolute bottom-12 right-12' 
              src={assets.upload_icon} 
              alt="Upload" 
            />
          </div>
          <input 
            onChange={(e) => setImage(e.target.files?.[0] || null)} 
            type="file" 
            id="image" 
            hidden 
            accept="image/*"
          />
        </label>
      ) : (
        <img className='w-36 rounded' src={userProfileData.image} alt="Profile" />
      )}

      {/* Name */}
      {isEdit ? (
        <input 
          className='bg-gray-50 py-2 px-4 text-3xl font-medium max-w-60' 
          type="text" 
          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))} 
          value={editData.name} 
        />
      ) : (
        <p className='font-medium text-3xl text-[#262626] mt-4'>{userProfileData.name}</p>
      )}

      <hr className='bg-[#ADADAD] h-[1px] border-none' />

      {/* Contact Information */}
      <div>
        <p className='text-gray-600 underline mt-3'>CONTACT INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-[#363636]'>
          <p className='font-medium'>Email id:</p>
          <p className='text-blue-500'>{userProfileData.email}</p>
          
          <p className='font-medium'>Phone:</p>
          {isEdit ? (
            <input 
              className='bg-gray-50 py-2 px-2 max-w-52 border-0 focus:ring-0 focus:outline-none appearance-none' 
              type="text" 
              onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))} 
              value={editData.phone} 
            />
          ) : (
            <p className='text-blue-500'>{userProfileData.phone}</p>
          )}

          <p className='font-medium'>Address:</p>
          {isEdit ? (
            <div>
              <input 
                className='bg-gray-50 w-full py-2 px-2 border-0 focus:ring-0 focus:outline-none appearance-none mb-1' 
                type="text" 
                placeholder="Line 1"
                onChange={(e) => setEditData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, line1: e.target.value } 
                }))} 
                value={editData.address.line1} 
              />
              <input 
                className='bg-gray-50 w-full py-2 px-2 border-0 focus:ring-0 focus:outline-none appearance-none' 
                type="text" 
                placeholder="Line 2"
                onChange={(e) => setEditData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, line2: e.target.value } 
                }))} 
                value={editData.address.line2} 
              />
            </div>
          ) : (
            <p className='text-gray-500'>
              {userProfileData.address?.line1} <br /> {userProfileData.address?.line2}
            </p>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div>
        <p className='text-[#797979] underline mt-3'>BASIC INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-gray-600'>
          <p className='font-medium'>Gender:</p>
          {isEdit ? (
            <select 
              className='max-w-20 bg-gray-50 outline-none py-3 px-2 border-0 focus:ring-0 focus:outline-none appearance-none' 
              onChange={(e) => setEditData(prev => ({ ...prev, gender: e.target.value }))} 
              value={editData.gender}
            >
              <option value="Not Selected">Not Selected</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          ) : (
            <p className='text-gray-500'>{userProfileData.gender}</p>
          )}

          <p className='font-medium'>Birthday:</p>
          {isEdit ? (
            <input 
              className='max-w-28 bg-gray-50 py-4 border-0 focus:outline-none focus: ring-0 appearance-none' 
              type='date' 
              onChange={(e) => setEditData(prev => ({ ...prev, dob: e.target.value }))} 
              value={editData.dob} 
            />
          ) : (
            <p className="text-gray-500">
  {new Date(userProfileData.dob).toLocaleDateString("en-GB")}
</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='mt-10'>
        {isEdit ? (
          <div className='flex gap-3'>
            <button 
              onClick={handleProfileUpdate}
              disabled={updateProfileMutation.isPending}
              className='border border-[#5F6FFF] px-8 py-2 rounded-full hover:bg-[#5F6FFF] hover:text-white transition-all disabled:opacity-50'
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save information'}
            </button>
            <button 
              onClick={() => {
                setIsEdit(false)
                setImage(null)
              }}
              className='border border-gray-400 px-8 py-2 rounded-full hover:bg-gray-100 transition-all'
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            onClick={startEdit}
            className='border border-[#5F6FFF] px-8 py-2 rounded-full hover:bg-[#5F6FFF] hover:text-white transition-all'
          >
            Edit
          </button>
        )}
      </div>
    </div>
  )
}
