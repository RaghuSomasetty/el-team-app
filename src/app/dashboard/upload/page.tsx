'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'

const AREAS = ['M-1 Furnace', 'M-2 Furnace', 'Reformer Area', 'DRI Handling Area', 'Utilities', 'Substation']

export default function UploadPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [form, setForm] = useState({
    equipmentName: '', tagNumber: '', area: '', description: '',
    technicianName: user?.name || '',
  })
  const [beforeImg, setBeforeImg] = useState<string>('')
  const [afterImg, setAfterImg] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // Compress image using canvas
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800
        const scaleSize = MAX_WIDTH / img.width
        canvas.width = MAX_WIDTH
        canvas.height = img.height * scaleSize
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7) // 70% quality
        if (type === 'before') setBeforeImg(compressedBase64)
        else setAfterImg(compressedBase64)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          technicianName: form.technicianName || user?.name,
          beforeImageUrl: beforeImg,
          afterImageUrl: afterImg,
        }),
      })
      if (res.ok) {
        setSuccess(true)
        setForm({ equipmentName: '', tagNumber: '', area: '', description: '', technicianName: user?.name || '' })
        setBeforeImg(''); setAfterImg('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Upload Maintenance Activity" subtitle="Record your maintenance work with photos">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>
            ✅ Maintenance activity uploaded successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '16px', fontSize: '15px' }}>📋 Activity Details</h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Equipment Name *</label>
                <input className="form-input" placeholder="e.g. Main Air Fan Motor" value={form.equipmentName} onChange={e => setForm({...form, equipmentName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tag Number</label>
                <input className="form-input" placeholder="e.g. 24.04.04" value={form.tagNumber} onChange={e => setForm({...form, tagNumber: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Area *</label>
                <select className="form-select" value={form.area} onChange={e => setForm({...form, area: e.target.value})} required>
                  <option value="">Select area...</option>
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Technician Name</label>
                <input className="form-input" value={form.technicianName} onChange={e => setForm({...form, technicianName: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description of Work *</label>
              <textarea className="form-textarea" rows={4} placeholder="Describe the maintenance work performed, parts replaced, observations, etc." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '16px', fontSize: '15px' }}>📸 Before / After Photos</h3>
            <div className="grid-2">
              {(['before', 'after'] as const).map(type => {
                const img = type === 'before' ? beforeImg : afterImg
                return (
                  <div key={type}>
                    <label className="form-label" style={{ marginBottom: '8px', display: 'block', color: type === 'before' ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                      {type === 'before' ? '🟡 Before Work' : '🟢 After Work'}
                    </label>
                    <label style={{ display: 'block', cursor: 'pointer' }}>
                      <div className={`upload-zone ${img ? 'dragover' : ''}`}>
                        {img ? (
                          <img src={img} alt={type} style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px' }} />
                        ) : (
                          <>
                            <div className="upload-zone-icon">📷</div>
                            <p>Tap to capture or upload {type} photo</p>
                            <p style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-muted)' }}>Supports JPG, PNG</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={e => handleImg(e, type)}
                        id={`${type}-image-input`}
                      />
                    </label>
                  </div>
                )
              })}
            </div>
          </div>

          <button type="submit" className="btn btn-success btn-lg" style={{ width: '100%' }} disabled={loading} id="upload-submit-btn">
            {loading ? <><span className="spinner" />&nbsp;Uploading...</> : '📤 Submit Maintenance Activity'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
