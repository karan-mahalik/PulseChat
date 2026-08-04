import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../src/pages/LoginPage'
import RegisterPage from '../src/pages/RegisterPage'
import ChatPage from '../src/pages/ChatPage'
import PublicRoute from '../src/components/PublicRoute'
import ProtectedRoute from '../src/components/ProtectedRoute'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>}
        />

        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>}
        />

        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>}
        />
        <Route path='*' element={<div className='text-center text-white mt-10'>Page not found</div>} />
      </Routes>
    </div>
  )
}

export default App
