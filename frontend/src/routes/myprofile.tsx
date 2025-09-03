import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useUpdateUserProfile, useUserProfile } from '../hooks/UserHooks';
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

export const Route = createFileRoute('/myprofile')({
  component: MyProfile,
})

function MyProfile() {
  // get user data
  const { data: userProfileData, isLoading: isLoadingUserProfile, error } = useUserProfile()
  const updateProfileMutation = useUpdateUserProfile();
  const { token } = useAppContext()
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
    }
  }
  // handle Profile Update
  const handleProfileUpdate = async () => {
    try {
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
    <div className="max-w-lg flex-flex-col gap-2 text-sm pt-5">
      {isEdit ? (
        <label htmlFor="image">
          <div className="inline-block relative cursor-pointer">
            <img
              src={image ? URL.createObjectURL(image) : userProfileData.image}
              alt="Profile Pictue"
              className='w-36 rounded opacity-73'
            />
            <img
              src={assets.upload_icon}
              alt="Upload Icon"
              className='w-10 absolute bottom-12 right-12'
            />
          </div>
          <input
            type="file"
            id='image'
            hidden
            accept='image/'
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </label>
      ) : (
        <img
          className='w-36 rounded'
          src={userProfileData.image}
          alt='Profile'
        />
      )}

      {isEdit ? (
        <input
          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
          type='text'
          value={editData.name}
          className='bg-gray-50 text-3xl font-medium max-w-60'
        />
      ) : (
        <p className="font-medium">{userProfileData.name}</p>
      )}

      <hr className='bg-[#ADADAD] h-[1px] border-none' />

      <div>
        <p className="underline text-gray-600 mt-3">CONTACT INFORMATION</p>
        <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-[#363636]">
          <p className="font-medium">Email id:</p>
          <p className="text-blue-500">{userProfileData.email}</p>
          <p className="font-medium">Phone</p>
          {isEdit ? (
            <input
              className='bg-gray-50 max-w-52'
              type='text'
              onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
              value={editData.phone}
            />
          ) : (
            <p className="text-blue-500">{userProfileData.phone}</p>
          )}

          <p className="font-medium">Address:</p>
          {isEdit ? (
            <div>
              <input
                type="text"
                placeholder='Line 1'
                className='bg-gray-50 w-full mb-1'
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  address: { ...prev.address, line1: e.target.value }
                }))}
                value={editData.address.line1}
              />
              <input
                className='bg-gray-50 w-full'
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

      <div>
        <p className="underline mt-3 text-[#797979]">BASIC INFORMATION</p>
        <div className=''>

        </div>
      </div>
    </div>

  )
}
