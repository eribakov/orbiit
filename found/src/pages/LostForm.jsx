import { Fragment, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import TrackReportModal from '../components/TrackReportModal'

const FIELDS = [
  { id: 'name', name: 'name', label: 'Name', placeholder: 'Your name' },
  { id: 'contact', name: 'contact', label: 'Contact info', placeholder: 'Email' },
  { id: 'what_lost', name: 'what_lost', label: 'What did you lose?', placeholder: 'e.g. keys, wallet, bag' },
  { id: 'item_desc', name: 'item_desc', label: 'Item description', placeholder: 'Give a brief description of your item' },
  { id: 'lost_location', name: 'lost_location', label: 'Where did you lose it?', placeholder: 'e.g. Central Park, bus line 42' },
  { id: 'date_lost', name: 'date_lost', label: 'Date lost (optional)', type: 'date', optional: true },
]

const emptyForm = () => ({
  name: '',
  contact: '',
  what_lost: '',
  item_desc: '',
  lost_location: '',
  date_lost: '',
})

export default function LostForm() {
  const [formData, setFormData] = useState(emptyForm)
  const [images, setImages] = useState([null, null, null])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [trackModalOpen, setTrackModalOpen] = useState(false)

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
    const input = document.getElementById(`lost-image-upload-${i}`)
    if (input) input.value = ''
  }

  const runSubmit = async (userId) => {
    setLoading(true)
    setError(null)

    const imageUrls = []
    for (const image of images) {
      if (image) {
        const fileName = `lost/${Date.now()}-${image.name}`
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
      user_id: userId,
      name: formData.name,
      contact: formData.contact,
      what_lost: formData.what_lost,
      item_desc: formData.item_desc,
      lost_location: formData.lost_location,
      photo_url_1: imageUrls[0],
      photo_url_2: imageUrls[1],
      photo_url_3: imageUrls[2],
    }
    if (formData.date_lost) {
      payload.date_lost = formData.date_lost
    }

    const { error: insertError } = await supabase.from('lost_items').insert(payload)

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess(true)
      setFormData(emptyForm())
      setImages([null, null, null])
    }

    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user?.id) {
      await runSubmit(session.user.id)
      return
    }
    setTrackModalOpen(true)
  }

  const handleContinueWithoutAccount = async () => {
    setTrackModalOpen(false)
    await runSubmit(null)
  }

  if (success) return <p>Your item has been submitted!</p>

  return (
    <>
      <form onSubmit={handleSubmit} className="lost-form">
        {error && <p className="lost-form-error" role="alert">{error}</p>}

        {FIELDS.map(({ id, name, label, placeholder, type, optional }) => (
          <Fragment key={id}>
            <label htmlFor={id}>{label}</label>
            <input
              id={id}
              name={name}
              type={type || 'text'}
              required={!optional}
              placeholder={placeholder}
              value={formData[name]}
              onChange={handleChange}
            />
          </Fragment>
        ))}

        <div className="lost-form-photos-wrap">
          <label>Photos (optional)</label>
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
              onClick={() => document.getElementById(`lost-image-upload-${i}`).click()}
            >
              <input
                id={`lost-image-upload-${i}`}
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

        <button type="submit" className="lost-form-submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      <TrackReportModal
        isOpen={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        onContinueWithoutAccount={handleContinueWithoutAccount}
      />
    </>
  )
}
