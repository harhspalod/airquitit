"use client" // This is a client component, so we can use hooks and other client-side features
import { supabase } from '@/services/supabaseClient'
import React, { useEffect, useState } from 'react'
import { UserDetailContext } from '@/context/UserDetailContext'
import { useContext } from 'react';

function Provider({ children }) {
  const [user, setUser] = useState()

  useEffect(() => {
    const createNewUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if user exists in the database
        let { data: Users, error } = await supabase
          .from('Users')
          .select("*")
          .eq('email', user?.email)

        console.log(Users)
        // If user doesn't exist and required properties are present, create a new user
        if (Users?.length === 0) {
          if (!user.email || !user.user_metadata.name) {
            return
          }
          const { data, error } = await supabase
            .from("Users")
            .insert([
              {
                name: user?.user_metadata?.name,
                email: user?.email,
                picture: user?.user_metadata?.picture
              }
            ])
          console.log(data)
          setUser(data)
        } else {
          setUser(Users[0])
        }
      }
    }
    createNewUser()
  }, [])

  return (
    <UserDetailContext.Provider value={{user, setUser}}>
    <div>{children}</div>
    </UserDetailContext.Provider>
  )
}

export default Provider

export const useUser=()=>{
  const context=useContext(UserDetailContext);
  return context;
}