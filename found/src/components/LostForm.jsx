import { Fragment, useState } from 'react'
import { supabase } from '../supabaseClient'

const FIELDS = [
  { id: 'name', name: 'name', label: 'Name', placeholder: 'Your name' },
  { id: 'contact', name: 'contact', label: 'Contact info', placeholder: 'Email or phone' },
  { id: 'what_lost', name: 'what_lost', label: 'What did you lose?', placeholder: 'e.g. keys, wallet, bag' },
  { id: 'item_desc', name: 'item_desc', label: 'Item description', placeholder: 'Give a brief description of your item including any distinguishing features' },
  { id: 'lost_location', name: 'lost_location', label: 'Where did you lose it?', placeholder: 'e.g. Central Park, bus line 42' },
]

export default function LostForm() {
  const [formData, setFormData] = useState({
    name: '', contact: '', what_lost: '', item_desc: '', lost_location: ''
  })
  const [images, setImages] = useState([null, null, null])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).slice(0, 3)
    const updated = [null, null, null]
    files.forEach((file, i) => updated[i] = file)
    setImages(updated)
  }

  const handleDragOver = (e) => e.preventDefault()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const imageUrls = []
    for (const image of images) {
      if (image) {
        const fileName = `lost/${Date.now()}-${image.name}`
        const { data, error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(fileName, image)

        if (uploadError) {
          alert('Image upload failed: ' + uploadError.message)
          setLoading(false)
          return
        }
        imageUrls.push(data.path)
      } else {
        imageUrls.push(null)
      }
    }

    const { error } = await supabase
      .from('lost_items')
      .insert({
        ...formData,
        photo_url_1: imageUrls[0],
        photo_url_2: imageUrls[1],
        photo_url_3: imageUrls[2],
      })

    if (error) {
      alert('Something went wrong: ' + error.message)
    } else {
      setSuccess(true)
      setFormData({ name: '', contact: '', what_lost: '', item_desc: '', lost_location: '' })
      setImages([null, null, null])
    }

    setLoading(false)
  }

  if (success) return <p>Your item has been submitted!</p>

  return (
    <form onSubmit={handleSubmit} className="lost-form">
      {FIELDS.map(({ id, name, label, placeholder }) => (
        <Fragment key={id}>
          <label htmlFor={id}>{label}</label>
          <input
            id={id}
            name={name}
            type="text"
            required
            placeholder={placeholder}
            value={formData[name]}
            onChange={handleChange}
          />
        </Fragment>
      ))}

      <label>Photos (optional)</label>
{[0, 1, 2].map((i) => (
  <div
    key={i}
    className="dropzone"
    onDrop={(e) => {
      e.preventDefault()
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
        const file = e.target.files[0]
        if (!file) return
        const updated = [...images]
        updated[i] = file
        setImages(updated)
      }}
    />
    {images[i] ? (
      <span className="dropzone-file">{images[i].name}</span>
    ) : (
      <>
        <p className="dropzone-icon">📁</p>
        <p className="dropzone-text">Photo {i + 1}</p>
        <p className="dropzone-hint">drag & drop or click</p>
      </>
    )}
  </div>
))}

      <button type="submit" className="lost-form-submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}