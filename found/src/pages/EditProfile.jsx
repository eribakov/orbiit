import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

const EyeOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
  </svg>
)

export default function EditProfilePage() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email)

      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      if (data) setFullName(data.name ?? '')
    }
    loadProfile()
  }, [])

const handleSave = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords don't match.")
      setLoading(false)
      return
    }
    if (newPassword && newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }
    if (newPassword && !currentPassword) {
      setError('Please enter your current password.')
      setLoading(false)
      return
    }

    if (newPassword) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      if (signInError) {
        setError('Current password is incorrect.')
        setLoading(false)
        return
      }

      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword })
      if (passwordError) { setError(passwordError.message); setLoading(false); return }
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, name: fullName })

    if (profileError) { setError(profileError.message); setLoading(false); return }

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    })
    if (authError) { setError(authError.message); setLoading(false); return }
if (email.trim() !== user.email) {
  const { error: emailError } = await supabase.rpc('update_user_email', {
    user_id: user.id,
    new_email: email.trim()
  })
  if (emailError) { setError(emailError.message); setLoading(false); return }

  await supabase
    .from('profiles')
    .update({ email: email.trim() })
    .eq('id', user.id)
}

    setMessage('Profile updated successfully!')
    setNewPassword('')
    setConfirmPassword('')
    setCurrentPassword('')
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-orb" />
      <div className="auth-ring auth-ring-1" />
      <div className="auth-ring auth-ring-2" />
      <div className="auth-ring auth-ring-3" />

      <div className="auth-card">
        <div className="auth-logo-row">
          <img src="/Orbiit Logo.png" alt="Orbiit logo" className="auth-nav-logo" />
          <span className="auth-brand">Orbiit</span>
        </div>

        <h1 className="auth-heading">Edit profile</h1>
        <p className="auth-subheading">Update your account details</p>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}

        <p className="auth-section-label">Personal info</p>
        <div className="auth-fields">
          <input
            className="auth-input"
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="auth-divider-line" />

        <p className="auth-section-label">Change password</p>
        <div className="auth-fields">
          <div className="auth-input-wrap">
            <input
              className="auth-input"
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="Current password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowCurrentPassword(p => !p)}>
              {showCurrentPassword ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
          <div className="auth-input-wrap">
            <input
              className="auth-input"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowNewPassword(p => !p)}>
              {showNewPassword ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
          <div className="auth-input-wrap">
            <input
              className="auth-input"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPassword(p => !p)}>
              {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
        </div>

        <button className="auth-submit" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save changes'}
        </button>

        <button className="auth-back-btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  )
}