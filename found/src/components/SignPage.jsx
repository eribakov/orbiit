import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function SignPage({ onSuccess, onLoginClick }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleStep1 = () => {
    setError('')
    if (!email || !password || !confirmPassword) { setError('Please fill in all fields.'); return }
    if (password !== confirmPassword) { setError("Passwords don't match."); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setStep(2)
  }

  const handleSignup = async () => {
    setError('')
    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email,
      })
    }

    setDone(true)
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) setError(error.message)
  }

  const styles = `
    .auth-page {
      position: relative; overflow: hidden;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100svh; padding: 2rem 1.5rem;
      background: var(--bg);
    }
    .auth-orb {
      position: absolute; width: 350px; height: 350px; border-radius: 50%;
      background: radial-gradient(circle, rgba(70,50,180,0.25) 0%, rgba(160,100,220,0.1) 50%, transparent 70%);
      top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 0;
    }
    .auth-ring { position: absolute; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 0; }
    .auth-ring-1 { width: 320px; height: 320px; border: 1px solid rgba(160,100,220,0.18); }
    .auth-ring-2 { width: 460px; height: 460px; border: 1px solid rgba(160,100,220,0.1); }
    .auth-ring-3 { width: 600px; height: 600px; border: 1px solid rgba(160,100,220,0.06); }
    .auth-card {
      position: relative; z-index: 1;
      background: var(--bg);
      border: 1px solid rgba(160,100,220,0.2);
      border-radius: 16px; padding: 2rem;
      width: 100%; max-width: 22rem;
      box-shadow: 0 8px 40px rgba(70,50,180,0.15);
      animation: authUp 0.5s ease both;
    }
    @keyframes authUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .auth-logo-row {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; margin-bottom: 0.5rem;
    }
    .auth-nav-logo { width: 28px; height: 28px; object-fit: contain; }
    .auth-brand { font-size: 1rem; font-weight: 600; font-family: "Google Sans", sans-serif; color: var(--text-h); }
    .auth-heading { font-size: 1.4rem; font-weight: 600; font-family: "Google Sans", sans-serif; color: var(--text-h); text-align: center; margin-bottom: 0.25rem; }
    .auth-subheading { font-size: 0.85rem; color: var(--text); text-align: center; margin-bottom: 1.5rem; }
    .auth-steps { display: flex; gap: 6px; justify-content: center; margin-bottom: 1.5rem; }
    .auth-step-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); transition: background 0.3s; }
    .auth-step-dot.active { background: var(--logo-mid); }
    .auth-fields { display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1rem; }
    .auth-input {
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border); border-radius: 8px;
      font: inherit; font-size: 0.9rem;
      background: var(--bg); color: var(--text-h);
      transition: border-color 0.2s, box-shadow 0.2s;
      width: 100%; box-sizing: border-box;
    }
    .auth-input::placeholder { color: var(--text); opacity: 0.6; }
    .auth-input:focus { outline: none; border-color: var(--logo-mid); box-shadow: 0 0 0 2px rgba(160,100,220,0.15); }
    .auth-submit {
      width: 100%; padding: 0.7rem; border: none; border-radius: 9999px;
      font-size: 0.95rem; font-weight: 600; font-family: "Google Sans", sans-serif;
      color: #fff; background: linear-gradient(135deg, var(--logo-mid), var(--logo-deep));
      cursor: pointer; transition: opacity 0.2s; margin-bottom: 0.75rem;
    }
    .auth-submit:hover { opacity: 0.8; }
    .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .auth-back-btn {
      width: 100%; padding: 0.7rem; border: 1px solid var(--border); border-radius: 9999px;
      font-size: 0.95rem; font-weight: 600; font-family: "Google Sans", sans-serif;
      color: var(--text-h); background: transparent;
      cursor: pointer; transition: opacity 0.2s; margin-bottom: 0.75rem;
    }
    .auth-back-btn:hover { opacity: 0.7; }
    .auth-divider { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .auth-divider-line { flex: 1; height: 1px; background: var(--border); }
    .auth-divider-text { font-size: 0.78rem; color: var(--text); opacity: 0.6; }
    .auth-google {
      width: 100%; padding: 0.65rem;
      border: 1px solid var(--border); border-radius: 9999px;
      font-size: 0.9rem; font-weight: 600; font-family: "Google Sans", sans-serif;
      background: var(--bg); color: var(--text-h); cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      transition: border-color 0.2s, background 0.2s;
    }
    .auth-google:hover { border-color: var(--logo-mid); background: rgba(160,100,220,0.05); }
    .auth-error { font-size: 0.82rem; color: #f87171; margin-bottom: 0.75rem; }
    .auth-switch { margin-top: 1.25rem; font-size: 0.83rem; color: var(--text); text-align: center; }
    .auth-switch-link {
      color: var(--logo-mid); cursor: pointer; font-weight: 600;
      background: none; border: none; font: inherit; text-decoration: underline;
    }
    .auth-switch-link:hover { opacity: 0.7; }
    .auth-email-highlight {
      color: var(--text-h);
      font-weight: 600;
    }
  `

  if (done) {
    return (
      <>
        <style>{styles}</style>
        <div className="auth-page">
          <div className="auth-orb" />
          <div className="auth-ring auth-ring-1" />
          <div className="auth-ring auth-ring-2" />
          <div className="auth-ring auth-ring-3" />
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div className="auth-logo-row">
              <img src="/Orbiit Logo.png" alt="Orbiit logo" className="auth-nav-logo" />
              <span className="auth-brand">Orbiit</span>
            </div>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📬</div>
            <h1 className="auth-heading">Check your email</h1>
            <p className="auth-subheading" style={{ marginBottom: '1.5rem' }}>
              We sent a confirmation link to <span className="auth-email-highlight">{email}</span>. Click it to activate your account.
            </p>
            <button className="auth-submit" onClick={onLoginClick}>
              Back to log in
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{styles}</style>

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

          <h1 className="auth-heading">{step === 1 ? 'Create account' : 'About you'}</h1>
          <p className="auth-subheading">{step === 1 ? 'Step 1 of 2 — your login details' : 'Step 2 of 2 — just a bit more'}</p>

          <div className="auth-steps">
            <div className={`auth-step-dot ${step >= 1 ? 'active' : ''}`} />
            <div className={`auth-step-dot ${step >= 2 ? 'active' : ''}`} />
          </div>

          {error && <p className="auth-error">{error}</p>}

          {step === 1 && (
            <>
              <div className="auth-fields">
                <input className="auth-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="auth-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <input className="auth-input" type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <button className="auth-submit" onClick={handleStep1}>Continue</button>
              <div className="auth-divider">
                <div className="auth-divider-line" />
                <span className="auth-divider-text">or</span>
                <div className="auth-divider-line" />
              </div>
              <button className="auth-google" onClick={handleGoogle}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="auth-fields">
                <input className="auth-input" type="text" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <button className="auth-submit" onClick={handleSignup} disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
              <button className="auth-back-btn" onClick={() => { setStep(1); setError('') }}>
                Back
              </button>
            </>
          )}

          <p className="auth-switch">
            Already have an account?{' '}
            <button className="auth-switch-link" onClick={onLoginClick}>Log in</button>
          </p>
        </div>
      </div>
    </>
  )
}