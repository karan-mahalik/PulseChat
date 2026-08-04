import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://localhost:5000'

const LoginPage = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const {setUser} = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data?.message || 'Login Failed')
                setLoading(false)
                return
            }

            console.log('Logged in:', data.user);
            setUser(data.user)
            navigate('/chat')
        } catch (error) {
            console.log(error)
            setError('Something went wrong.Try again')
            setLoading(false)
        }
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-[#05060A]'>
            <div className='w-full max-w-md bg-[#0C0F1A]/90 border border-white/10 rounded-2xl p-8 shadow-xl'>
                <h1 className='text-3xl font-semibold text-white text-center mb-2'>
                    Pulse
                    <span className='text-[#00EAFF]'>Chat</span>
                </h1>
                <p className='text-sm text-gray-400 text-center mb-8'>Real-time messaging with a heartbeat ⚡</p>
                {error && (
                    <div className='mb-4 text-sm text-red-400 bg-red-950/40 border border-red-500/40 rounded-lg px-3 py-2'>
                        {error}
                    </div>
                )}
                <form action="" onSubmit={handleSubmit} className='space-y-5'>
                    <div className='spac-y-1'>
                        <label htmlFor="" className='block text-sm text-gray-300'>Email</label>
                        <input type="email" required placeholder='Enter your email' value={email} onChange={(e)=> setEmail(e.target.value)} className='w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00EAFF] focus:ring-1 focus:ring-[#00EAFF]' />
                    </div>

                    <div className='spac-y-1'>
                        <label htmlFor="" className='block text-sm text-gray-300'>Password</label>
                        <input type="password" required placeholder='Enter your password' value={password} onChange={(e)=> setPassword(e.target.value)} className='w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00EAFF] focus:ring-1 focus:ring-[#00EAFF]' />
                    </div>
                    <button type='submit' disabled={loading} className='w-full mt-2 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#4F47E0] hover:bg-[#4F47E0] text-white shadow-md focus:outline-none focus:ring-2 focus:ring-[#00EAFF] focus:ring-offset-2 focus:ring-offset-[#05060A] transition disabled:opacity-60 disabled:cursor-not-allowed'>{loading ? 'Logging in...' : 'Continue'}</button>
                </form>
                <p className='text-sm text-gray-400 text-center mt-6'>New here?{' '}
                    <Link to='/register' className='text-[#00EAFF]'>Create an account</Link>
                </p>
            </div>
        </div>
    )
}

export default LoginPage
