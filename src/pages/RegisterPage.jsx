import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://localhost:5000'


const RegisterPage = () => {
    const navigate = useNavigate()
    const [name, setName] = useState('')
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
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ name, email, password })
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data?.message || 'Registration Failed')
                setLoading(false)
                return
            }
            console.log('Registers:', data.user);
            setUser(data.user)
            navigate('/chat')
        } catch (error) {
            console.log(error)
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }
    return (
        <div className='min-h-screen flex items-center justify-center bg-[#05060A]'>
            <div className='w-full max-w-md bg-[#0C0F1A]/90 border border-white/10 rounded-2xl p-8 shadow-xl'>
                <h1 className='text-3xl font-semibold text-white text-center mb-2'>Join
                    <span className='text-[#00EAFF]'>PulseChat</span>
                </h1>
                <p className='text-sm text-gray-400 text-center mb-8'>Create your account & start chatting in seconds.</p>
                {error && (
                    <div className='mb-4 text-sm text-red-400 bg-red-950/40 border border-red-500/40 rounded-lg px-3 py-2'>
                        {error}
                    </div>
                )}
                <form action="" onSubmit={handleSubmit} className='space-y-5'>
                    <div className='space-y-1'>
                        <label htmlFor="" className='block text-sm text-gray-300'>Name</label>
                        <input type="text" required placeholder='Your name' value={name} onChange={(e) => setName(e.target.value)} className='w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00EAFF] focus:ring-1 focus:ring-[#00EAFF]' />
                    </div>
                    <div className='space-y-1'>
                        <label htmlFor="" className='block text-sm text-gray-300'>Email</label>
                        <input type="email" required placeholder='Your email' value={email} onChange={(e) => setEmail(e.target.value)} className='w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00EAFF] focus:ring-1 focus:ring-[#00EAFF]' />
                    </div>
                    <div className='space-y-1'>
                        <label htmlFor="" className='block text-sm text-gray-300'>Password</label>
                        <input type="password" required placeholder='Choose a strong password' value={password} onChange={(e) => setPassword(e.target.value)} className='w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00EAFF] focus:ring-1 focus:ring-[#00EAFF]' />
                    </div>
                    <button type='submit' disabled={loading} className='w-full mt-2 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#635BFF] hover:bg-[#4F47E0] text-white shadow-md focus:outline-none focus:ring-2 focus:ring-[#00EAFF] focus:ring-offset-2 focus:ring-offset-[#05060A] transition disabled:opacity-60 disabled:cursor-not-allowed'>
                        {loading ? 'Creating account..' : 'Sign up'}
                    </button>
                </form>
                <p className='text-sm text-gray-400 text-center mt-6'>Already have an account?{' '}
                    <Link to='/login' className='text-[#00EAFF] hover:underline'>Log in
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default RegisterPage
