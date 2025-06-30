"use client";
import { useUser } from '@/app/provider';
import React from 'react';
import Image from 'next/image';

function WelcomeContainer() {
    const { user } = useUser();

    return (
        <div className="bg-white p-5 rounded-xl border shadow-md flex justify-between items-center">
            <div>
                <h2 className="text-lg font-bold">
                    Welcome Back, <span className="text-blue-600">{user?.name}</span>
                </h2>
                <h2 className="text-gray-500">AI-Driven Interviews, Hassle-Free Hiring</h2>
            </div>
            
            {user?.picture && (
                <Image 
                    src={user.picture} 
                    alt='userAvatar' 
                    width={50} 
                    height={50} 
                    className='rounded-full' 
                />
            )}
        </div>
    );
}

export default WelcomeContainer;