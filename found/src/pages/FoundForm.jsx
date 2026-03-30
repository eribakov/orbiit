import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { supabase } from '../supabaseClient'
import TrackReportModal from '../components/TrackReportModal'
import {
  contactLooksLikeEmail,
  contactEmailBelongsToExistingAccount,
} from '../components/guestContactCheck'
import { ITEM_CATEGORIES, ITEMS_BY_CATEGORY } from '../components/itemCategoryOptions'

const FIELDS = [
  { id: 'name', name: 'name', label: 'Name', placeholder: 'Your name' },
  { id: 'contact', name: 'contact', label: 'Contact info', placeholder: 'Email' },
  { id: 'item_desc', name: 'item_desc', label: 'Item description', placeholder: 'Give a brief description of your item including any distinguishing features' },
  { id: 'where_found', name: 'where_found', label: 'Where did you find it?', placeholder: 'e.g. Central Park, bus line 42' },
  { id: 'date_found', name: 'date_found', label: 'Date found', type: 'date', optional: true },
]

const emptyForm = () => ({
  name: '',
  contact: '',
  category: '',
  what_found: '',
  item_desc: '',
  where_found: '',
  date_found: '',
})

export default function FoundForm() {
  const [formData, setFormData] = useState(emptyForm)
  const [images, setImages] = useState([null, null, null])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [showTrackModal, setShowTrackModal] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      setUser(session.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', session.user.id)
        .maybeSingle()

      setFormData(prev => ({
        ...prev,
        name: profile?.name ?? session.user.user_metadata?.full_name ?? '',
        contact: session.user.email ?? '',
      }))
    }
    loadUser()
  }, [])

  const previewUrls = useMemo(
    () => images.map((file) => (file ? URL.createObjectURL(file) : null)),
    [images],
  )

  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => u && URL.revokeObjectURL(u))
    }
  }, [previewUrls])

  const handleChange = (e) => {
    setError(null)
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCategoryChange = (e) => {
    setError(null)
    setFormData({ ...formData, category: e.target.value, what_found: '' })
  }

  const clearImage = (i) => {
    setError(null)
    const u = [...images]
    u[i] = null
    setImages(u)
    const input = document.getElementById(`image-upload-${i}`)
    if (input) input.value = ''
  }

  const performSubmit = async (userId) => {
    setLoading(true)
    setError(null)

    if (!userId && contactLooksLikeEmail(formData.contact)) {
      const exists = await contactEmailBelongsToExistingAccount(formData.contact)
      if (exists) {
        setError(
          <>
            Looks like you already have an account with us. Please log in to track your report.{' '}
            <Link to="/auth">Log in</Link>
          </>,
        )
        setLoading(false)
        return
      }
    }

    const imageUrls = []
    for (const image of images) {
      if (image) {
        const fileName = `found/${Date.now()}-${image.name}`
        const { data, error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(fileName, image)

        if (uploadError) {
          setError(`Image upload failed: ${uploadError.message}`)
          setLoading(false)
          return
        }
        imageUrls.push(data.path)
      } else {
        imageUrls.push(null)
      }
    }

    const payload = {
      user_id: userId ?? null,
      name: formData.name,
      contact: formData.contact,
      category: formData.category,
      what_found: formData.what_found,
      item_desc: formData.item_desc,
      where_found: formData.where_found,
      photo_url_1: imageUrls[0],
      photo_url_2: imageUrls[1],
      photo_url_3: imageUrls[2],
    }
    if (formData.date_found) {
      payload.date_found = formData.date_found
    }

    const { error: insertError } = await supabase.from('found_items').insert(payload)

    if (insertError) {
      setError(insertError.message)
    } else {
      if (!userId) {
        emailjs
          .send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_FOUND_TEMPLATE_ID,
            {
              to_email: formData.contact,
              name: formData.name,
              item: `${formData.category} — ${formData.what_found}`,
              location: formData.where_found,
              date: formData.date_found || 'Not specified',
            },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
          )
          .then((result) => console.log('Email sent:', result))
          .catch((error) => console.log('Email error:', error))
      }
      setSuccess(true)
      setFormData(emptyForm())
      setImages([null, null, null])
    }

    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) {
      await performSubmit(session.user.id)
      return
    }

    setShowTrackModal(true)
  }

  if (success) return <p>Your item has been submitted!</p>

  return (
    <form onSubmit={handleSubmit} className="found-form">
      <TrackReportModal
        isOpen={showTrackModal}
        onClose={() => setShowTrackModal(false)}
        onContinueWithoutAccount={async () => {
          setShowTrackModal(false)
          await performSubmit(null)
        }}
      />
      {error && (
        <div className="found-form-error" role="alert">
          {error}
        </div>
      )}

      {FIELDS.slice(0, 2).map(({ id, name, label, placeholder, type, optional }) => {
        const isAutoFilled = user && (name === 'name' || name === 'contact')
        return (
          <Fragment key={id}>
            <label htmlFor={id}>
              {label}
              {isAutoFilled && (
                <span style={{ fontSize: '0.75rem', opacity: 0.5, marginLeft: '0.4rem' }}>
                  (auto-filled)
                </span>
              )}
            </label>
            <input
              id={id}
              name={name}
              type={type || 'text'}
              required={optional !== true}
              placeholder={placeholder}
              value={formData[name]}
              onChange={handleChange}
              readOnly={isAutoFilled}
              style={isAutoFilled ? { opacity: 0.7, cursor: 'default' } : {}}
            />
          </Fragment>
        )
      })}

      <Fragment key="found-category-item">
        <label htmlFor="found-item-category">Category</label>
        <select
          id="found-item-category"
          name="category"
          value={formData.category}
          onChange={handleCategoryChange}
          required
        >
          <option value="">Select a category</option>
          {ITEM_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label htmlFor="found-item-specific">Item</label>
        <select
          id="found-item-specific"
          name="what_found"
          value={formData.what_found}
          onChange={handleChange}
          required
          disabled={!formData.category}
        >
          <option value="">
            {formData.category ? 'Select an item' : 'Select a category first'}
          </option>
          {(ITEMS_BY_CATEGORY[formData.category] || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Fragment>

      {FIELDS.slice(2).map(({ id, name, label, placeholder, type, optional }) => {
        const isAutoFilled = user && (name === 'name' || name === 'contact')
        return (
          <Fragment key={id}>
            <label htmlFor={id}>
              {label}
              {isAutoFilled && (
                <span style={{ fontSize: '0.75rem', opacity: 0.5, marginLeft: '0.4rem' }}>
                  (auto-filled)
                </span>
              )}
            </label>
            <input
              id={id}
              name={name}
              type={type || 'text'}
              required={optional !== true}
              placeholder={placeholder}
              value={formData[name]}
              onChange={handleChange}
              readOnly={isAutoFilled}
              style={isAutoFilled ? { opacity: 0.7, cursor: 'default' } : {}}
            />
          </Fragment>
        )
      })}

      <div className="found-form-photos-wrap">
        <label id="found-photos-label">
          Photos <span className="found-form-hint">(at least one required)</span>
        </label>
        <input
          className="found-form-photo-gate"
          type="text"
          name="photo_gate"
          aria-label="Add at least one photo to continue"
          tabIndex={-1}
          autoComplete="off"
          value={images.some(Boolean) ? 'ok' : ''}
          onChange={() => { }}
          required
        />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="dropzone"
            onDrop={(e) => {
              e.preventDefault()
              setError(null)
              const file = e.dataTransfer.files[0]
              if (!file) return
              const updated = [...images]
              updated[i] = file
              setImages(updated)
            }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById(`image-upload-${i}`).click()}
          >
            <input
              id={`image-upload-${i}`}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                setError(null)
                const file = e.target.files[0]
                if (!file) return
                const updated = [...images]
                updated[i] = file
                setImages(updated)
              }}
            />
            {images[i] ? (
              <div className="dropzone-preview-wrap">
                <img
                  src={previewUrls[i]}
                  alt={`Preview ${i + 1}`}
                  className="dropzone-preview-img"
                />
                <button
                  type="button"
                  className="dropzone-clear"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearImage(i)
                  }}
                  aria-label={`Remove photo ${i + 1}`}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <p className="dropzone-icon">📁</p>
                <p className="dropzone-text">Photo {i + 1}</p>
                <p className="dropzone-hint">drag & drop or click</p>
              </>
            )}
          </div>
        ))}
      </div>

      <button type="submit" className="found-form-submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}