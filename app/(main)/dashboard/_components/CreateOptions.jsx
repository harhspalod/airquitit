import { Phone, Video } from 'lucide-react'
import React from 'react'
import Link from 'next/link'

function CreateOptions() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
      <Link href={'/dashboard/create-interview'}>
        <div className='bg-white border border-gray-200 rounded-lg p-5 shadow-sm cursor-pointer'>
          <Video className='p-2 text-blue-600 bg-blue-50 rounded-lg h-12 w-12' />
          <h2 className="mt-3 font-semibold">Create New Interview</h2>
          <p className='text-gray-500 text-sm'>
            Create AI interviews and schedule them with candidates
          </p>
        </div>
      </Link>

      <div className='bg-white border border-gray-200 rounded-lg p-5 shadow-sm'>
        <Phone className='p-2 text-blue-600 bg-blue-50 rounded-lg h-12 w-12' />
        <h2 className="mt-3 font-semibold">Create Phone Screening Call</h2>
        <p className='text-gray-500 text-sm'>
          Schedule phone screening calls with candidates
        </p>
      </div>
    </div>
  )
}

export default CreateOptions