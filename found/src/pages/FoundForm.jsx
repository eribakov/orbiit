import { Fragment, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'


const FIELDS = [
  { id: 'name', name: 'name', label: 'Name', placeholder: 'Your name' },
  { id: 'contact', name: 'contact', label: 'Contact info', placeholder: 'Email' },
  { id: 'what_found', name: 'what_found', label: 'What did you find?', placeholder: 'e.g. keys, wallet, bag' },
  { id: 'item_desc', name: 'item_desc', label: 'Item description', placeholder: 'Give a brief description of your item including any distinguishing features' },
  { id: 'where_found', name: 'where_found', label: 'Where did you find it?', placeholder: 'e.g. Central Park, bus line 42' },
  { id: 'date_found', name: 'date_found', label: 'Date found', type: 'date', optional: true },
]

const emptyForm = () => ({
  name: '',
  contact: '',
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

  const clearImage = (i) => {
    setError(null)
    const u = [...images]
    u[i] = null
    setImages(u)
    const input = document.getElementById(`image-upload-${i}`)
    if (input) input.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      setError('Please log in to submit a report.')
      setLoading(false)
      return
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
      user_id: user.id,
      name: formData.name,
      contact: formData.contact,
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
      setSuccess(true)
      setFormData(emptyForm())
      setImages([null, null, null])
    }

    setLoading(false)
  }

  if (success) return <p>Your item has been submitted!</p>

  return (
    <form onSubmit={handleSubmit} className="found-form">
      {error && <p className="found-form-error" role="alert">{error}</p>}

      {FIELDS.map(({ id, name, label, placeholder, type, optional }) => (
        <Fragment key={id}>
          <label htmlFor={id}>{label}</label>
          <input
            id={id}
            name={name}
            type={type || 'text'}
            required={optional !== true}
            placeholder={placeholder}
            value={formData[name]}
            onChange={handleChange}
          />
        </Fragment>
      ))}

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
