    import React, { createContext, useContext, useEffect, useState } from 'react'

    const AuthContext = createContext(null)
    const API_URL = 'http://localhost:5000'

    export const AuthProvider = ({ children }) => {
        const [user, setUser] = useState(null)
        const [loading, setLoading] = useState(true)

        useEffect(() => {
            const chekAuth = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/auth/me`, {
                        credentials: 'include'
                    })

                    if (res.ok) {
                        const data = await res.json()
                        setUser(data.user)
                    }
                    else {
                        setUser(null)
                    }
                } catch (error) {
                    setUser(null)
                }
                finally {
                    setLoading(false)
                }
            }
            chekAuth()
        }, [])
        return (
            <AuthContext.Provider value={{user,setUser,loading}}>
                {children}
            </AuthContext.Provider>
        )
    }
    export const useAuth = () => useContext(AuthContext)