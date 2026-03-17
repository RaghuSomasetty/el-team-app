'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { motion } from 'framer-motion'

const DEPARTMENTS = ['Electrical', 'Mechanical', 'Operation', 'Instrumentation']
const DESIGNATIONS = ['Engineer', 'Supervisor', 'Technician']

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const user = session?.user as any
  
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    department: '',
    designation: '',
    phone: '',
    email: '',
  })
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        employeeId: user.employeeId || '',
        department: user.department || '',
        designation: user.designation || '',
        phone: user.phone || '',
        email: user.email || '',
      })
      setImage(user.image || null)
    }
  }, [user])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 400
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height
            height = MAX_SIZE
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const base64 = canvas.toDataURL('image/jpeg', 0.8)
        setImage(base64)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, image })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        await update({ 
          ...formData,
          image: image 
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="User Profile" subtitle="Manage your personal and professional information">
      <div className="max-w-4xl mx-auto p-4">
        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-6`}
          >
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Picture Section */}
          <div className="md:col-span-1">
            <div className="card text-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Profile Photo</h3>
              <div className="relative inline-block">
                <div 
                  className="w-40 h-40 rounded-full mx-auto border-4 border-[#00d2ff] shadow-2xl flex items-center justify-center overflow-hidden bg-[#1e293b]"
                  style={{
                    backgroundImage: image ? `url(${image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!image && <span className="text-5xl font-bold text-[#00d2ff]">{formData.name?.[0]}</span>}
                </div>
                <label className="absolute bottom-2 right-2 w-10 h-10 bg-[#00d2ff] rounded-full border-4 border-[#0a0f1e] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                  <span className="text-lg">📷</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <p className="mt-6 text-xs text-slate-400">Click the camera icon to upload or change your photo.</p>
            </div>
          </div>

          {/* Details Section */}
          <div className="md:col-span-2">
            <div className="card">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Professional Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.employeeId} 
                    onChange={e => setFormData({...formData, employeeId: e.target.value})} 
                    placeholder="EMP123"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select 
                    className="form-select" 
                    value={formData.department} 
                    onChange={e => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <select 
                    className="form-select" 
                    value={formData.designation} 
                    onChange={e => setFormData({...formData, designation: e.target.value})}
                  >
                    <option value="">Select Designation</option>
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{Designations[d as keyof typeof Designations] || d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="+91..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email ID (Read Only)</label>
                  <input 
                    type="email" 
                    className="form-input opacity-60" 
                    value={formData.email} 
                    readOnly 
                  />
                </div>
              </div>

              <div className="mt-10">
                <button 
                  type="submit" 
                  className="btn btn-primary w-full py-4 text-sm uppercase font-black tracking-widest shadow-[0_0_30px_rgba(0,210,255,0.3)]"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : '💾 Update Profile'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

const Designations = {
  'Engineer': 'Engineer',
  'Supervisor': 'Supervisor',
  'Technician': 'Technician'
}
