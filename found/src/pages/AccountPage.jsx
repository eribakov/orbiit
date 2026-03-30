import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { formatReportItemTitle } from '../components/itemCategoryOptions'

function getInitials(fullName) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatReportDate(value) {
  if (value == null || value === '') return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const STATUS_LABELS = { searching: 'Searching', found: 'Found', returned: 'Returned', holding: 'Holding' }
const ALL_STATUSES = ['searching', 'found', 'returned']
const MATCHED_STATUSES = ['found', 'returned']

function getImageUrl(path) {
  if (!path) return null
  const { data } = supabase.storage.from('item-photos').getPublicUrl(path)
  return data?.publicUrl ?? null
}

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function StatusSelect({ itemId, currentStatus, onStatusChange, hasMatch }) {
  const [busy, setBusy] = useState(false)
  const statuses = hasMatch ? MATCHED_STATUSES : ALL_STATUSES

  const handleChange = async (e) => {
    const newStatus = e.target.value
    if (newStatus === currentStatus) return
    setBusy(true)
    const { error } = await supabase.from('lost_items').update({ status: newStatus }).eq('id', itemId)
    if (!error) onStatusChange(itemId, newStatus)
    setBusy(false)
  }

  return (
    <div className="status-select-row">
      <label className="status-select-label" htmlFor={`status-select-${itemId}`}>Status</label>
      <select
        id={`status-select-${itemId}`}
        className={`status-select status-select--${currentStatus}`}
        value={currentStatus}
        onChange={handleChange}
        disabled={busy}
      >
        {statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
      {busy && <span className="status-select-busy" aria-live="polite">Saving…</span>}
    </div>
  )
}

function PhotoSlots({ slots, isLocked, onAddClick, onRemoveNew, onRemoveExisting, fileRefs }) {
  return (
    <div className="item-modal-own-photos">
      {slots.map((slot, i) => (
        <div key={i} className="item-modal-photo-slot">
          {slot.hasNew ? (
            <div className="item-modal-photo-wrap">
              <img src={slot.newPreview} alt={`Photo ${i + 1}`} className="item-modal-img" />
              {!isLocked && (
                <button type="button" className="item-modal-photo-remove"
                  onClick={() => onRemoveNew(i)} aria-label="Remove">✕</button>
              )}
            </div>
          ) : slot.hasExisting ? (
            <div className="item-modal-photo-wrap">
              <img src={slot.existingUrl} alt={`Photo ${i + 1}`} className="item-modal-img" />
              {!isLocked && (
                <button type="button" className="item-modal-photo-remove"
                  onClick={() => onRemoveExisting(i)} aria-label="Remove">✕</button>
              )}
            </div>
          ) : !isLocked ? (
            <button type="button" className="item-modal-photo-add"
              onClick={() => fileRefs[i].current?.click()}
              aria-label={`Add photo ${i + 1}`}>
              <span className="item-modal-photo-add-icon">+</span>
              <span className="item-modal-photo-add-text">Photo {i + 1}</span>
            </button>
          ) : (
            <div className="item-modal-photo-empty">—</div>
          )}
          <input ref={fileRefs[i]} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) onAddClick(i, e.target.files[0]) }} />
        </div>
      ))}
    </div>
  )
}

function usePhotoState(initial) {
  const [paths, setPaths] = useState(initial)
  const [newFiles, setNewFiles] = useState([null, null, null])
  const [previewUrls, setPreviewUrls] = useState([null, null, null])
  const fileRef0 = useRef(null), fileRef1 = useRef(null), fileRef2 = useRef(null)
  const fileRefs = [fileRef0, fileRef1, fileRef2]

  useEffect(() => {
    const urls = newFiles.map(f => f ? URL.createObjectURL(f) : null)
    setPreviewUrls(urls)
    return () => urls.forEach(u => u && URL.revokeObjectURL(u))
  }, [newFiles])

  const slots = [0, 1, 2].map(i => ({
    existingUrl: !newFiles[i] ? getImageUrl(paths[i]) : null,
    newPreview: previewUrls[i],
    hasExisting: !!paths[i] && !newFiles[i],
    hasNew: !!newFiles[i],
  }))

  const addFile = (i, f) => setNewFiles(prev => { const u = [...prev]; u[i] = f; return u })
  const removeNew = (i) => {
    setNewFiles(prev => { const u = [...prev]; u[i] = null; return u })
    if (fileRefs[i].current) fileRefs[i].current.value = ''
  }
  const removeExisting = (i) => setPaths(prev => { const u = [...prev]; u[i] = null; return u })

  const uploadAndGetPaths = async (bucket) => {
    let finalPaths = [...paths]
    if (newFiles.some(Boolean)) {
      for (let i = 0; i < 3; i++) {
        if (newFiles[i]) {
          const { data, error } = await supabase.storage.from('item-photos')
            .upload(`${bucket}/${Date.now()}-${i}-${newFiles[i].name}`, newFiles[i])
          if (error) throw new Error(error.message)
          finalPaths[i] = data.path
        }
      }
      setPaths(finalPaths)
      setNewFiles([null, null, null])
    }
    return finalPaths
  }

  return { slots, fileRefs, addFile, removeNew, removeExisting, uploadAndGetPaths }
}

/* ══════════════════════════════════════════
   Lost item modal
══════════════════════════════════════════ */
function LostItemModal({ item, onClose, onSave, onNotMine, onStatusChange }) {
  const [form, setForm] = useState({
    what_lost: item.raw.what_lost ?? '',
    item_desc: item.raw.item_desc ?? '',
    lost_location: item.raw.lost_location ?? '',
    date_lost: item.raw.date_lost ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [notMineLoading, setNotMineLoading] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const photos = usePhotoState([
    item.raw.photo_url_1 ?? null,
    item.raw.photo_url_2 ?? null,
    item.raw.photo_url_3 ?? null,
  ])

  const isReturned = item.status === 'returned'

  const finderImages = [
    getImageUrl(item.finder?.photo_url_1),
    getImageUrl(item.finder?.photo_url_2),
    getImageUrl(item.finder?.photo_url_3),
  ].filter(Boolean)

  const handleChange = e => {
    setSaveSuccess(false); setSaveError(null)
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    setSaving(true); setSaveError(null)
    try {
      const finalPaths = await photos.uploadAndGetPaths('lost')
      const { error } = await supabase.from('lost_items').update({
        what_lost: form.what_lost, item_desc: form.item_desc,
        lost_location: form.lost_location, date_lost: form.date_lost || null,
        photo_url_1: finalPaths[0], photo_url_2: finalPaths[1], photo_url_3: finalPaths[2],
      }).eq('id', item.id)
      if (error) setSaveError(error.message)
      else { setSaveSuccess(true); onSave(item.id, { ...form, photo_url_1: finalPaths[0], photo_url_2: finalPaths[1], photo_url_3: finalPaths[2] }) }
    } catch (e) { setSaveError(e.message) }
    setSaving(false)
  }

  const handleNotMine = async () => {
    setNotMineLoading(true)
    const { error } = await supabase.from('lost_items')
      .update({ matched_found_id: null, status: 'searching' }).eq('id', item.id)
    if (!error) { onNotMine(item.id); onClose() }
    setNotMineLoading(false)
  }

  return (
    <div className="item-modal-backdrop" onClick={onClose}>
      <div className="item-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="item-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="item-modal-title">{item.raw.what_lost ?? 'Lost item'}</h2>

        {finderImages.length > 0 && (
          <div className="item-modal-section">
            <p className="item-modal-label">Photos from finder</p>
            <div className="item-modal-images">
              {finderImages.map((url, i) => (
                <img key={i} src={url} alt={`Finder photo ${i + 1}`} className="item-modal-img" />
              ))}
            </div>
          </div>
        )}

        {item.finderContact && !isReturned && (
          <div className="item-modal-section finder-contact">
            <p className="finder-contact-label">Someone found this! 🎉</p>
            {item.finderName && <p className="finder-contact-name">{item.finderName}</p>}
            <p className="finder-contact-value">{item.finderContact}</p>
          </div>
        )}

        <div className="item-modal-section">
          <p className="item-modal-label">Your photos</p>
          <PhotoSlots slots={photos.slots} isLocked={isReturned} fileRefs={photos.fileRefs}
            onAddClick={photos.addFile} onRemoveNew={photos.removeNew} onRemoveExisting={photos.removeExisting} />
        </div>

        <div className="item-modal-section">
          <div className="item-modal-section-header">
            <p className="item-modal-label">{isReturned ? 'Item details' : 'Edit your report'}</p>
            {isReturned && <span className="item-modal-locked-text">Locked — item returned</span>}
          </div>
          <div className="item-modal-fields">
            <label className="item-modal-field-label" htmlFor="lost-modal-what">Item name</label>
            <input id="lost-modal-what" name="what_lost" className="item-modal-input"
              value={form.what_lost} onChange={handleChange} placeholder="e.g. keys, wallet, bag"
              disabled={true} readOnly={true} />
            <label className="item-modal-field-label" htmlFor="lost-modal-desc">Description</label>
            <textarea id="lost-modal-desc" name="item_desc" className="item-modal-input item-modal-textarea"
              value={form.item_desc} onChange={handleChange} placeholder="Describe your item"
              rows={3} disabled={isReturned} readOnly={isReturned} />
            <label className="item-modal-field-label" htmlFor="lost-modal-location">Location lost</label>
            <input id="lost-modal-location" name="lost_location" className="item-modal-input"
              value={form.lost_location} onChange={handleChange} placeholder="Where did you lose it?"
              disabled={isReturned} readOnly={isReturned} />
            <label className="item-modal-field-label" htmlFor="lost-modal-date">Date lost</label>
            <input id="lost-modal-date" name="date_lost" type="date" className="item-modal-input"
              value={form.date_lost} onChange={handleChange}
              disabled={isReturned} readOnly={isReturned} />
          </div>
          {saveError && <p className="item-modal-error">{saveError}</p>}
          {saveSuccess && <p className="item-modal-success">Saved!</p>}
        </div>

        {!isReturned && (
          <div className="item-modal-actions">
            <button type="button" className="item-modal-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {item.hasMatch && (
              <button type="button" className="item-modal-not-mine" onClick={handleNotMine}
                disabled={notMineLoading}>
                {notMineLoading ? '…' : "This isn't mine"}
              </button>
            )}
          </div>
        )}

        <div className="item-modal-status-row">
          <StatusSelect itemId={item.id} currentStatus={item.status}
            onStatusChange={onStatusChange} hasMatch={item.hasMatch} />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Found item modal
══════════════════════════════════════════ */
function FoundItemModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    what_found: item.raw.what_found ?? '',
    item_desc: item.raw.item_desc ?? '',
    where_found: item.raw.where_found ?? '',
    date_found: item.raw.date_found ?? '',
    contact: item.raw.contact ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const photos = usePhotoState([
    item.raw.photo_url_1 ?? null,
    item.raw.photo_url_2 ?? null,
    item.raw.photo_url_3 ?? null,
  ])

  const isReturned = item.raw.status === 'returned' || item.status === 'returned'

  const handleChange = e => {
    setSaveSuccess(false); setSaveError(null)
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    setSaving(true); setSaveError(null)
    try {
      const finalPaths = await photos.uploadAndGetPaths('found')
      const { error } = await supabase.from('found_items').update({
        what_found: form.what_found, item_desc: form.item_desc,
        where_found: form.where_found, date_found: form.date_found || null,
        contact: form.contact,
        photo_url_1: finalPaths[0], photo_url_2: finalPaths[1], photo_url_3: finalPaths[2],
      }).eq('id', item.id)
      if (error) setSaveError(error.message)
      else {
        setSaveSuccess(true)
        onSave(item.id, { ...form, photo_url_1: finalPaths[0], photo_url_2: finalPaths[1], photo_url_3: finalPaths[2] })
      }
    } catch (e) { setSaveError(e.message) }
    setSaving(false)
  }

  return (
    <div className="item-modal-backdrop" onClick={onClose}>
      <div className="item-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="item-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="item-modal-title">{item.raw.what_found ?? 'Found item'}</h2>

        {item.hasMatch && item.matchedLost && !isReturned && (
          <div className="item-modal-section finder-contact">
            <p className="finder-contact-label">Matched with a lost report! 🎉</p>
            {item.matchedLost.what_lost && (
              <p className="finder-contact-name">{item.matchedLost.what_lost}</p>
            )}
            {item.matchedLost.owner_name && (
              <p className="finder-contact-value">{item.matchedLost.owner_name}</p>
            )}
            {item.matchedLost.owner_contact && (
              <p className="finder-contact-value">{item.matchedLost.owner_contact}</p>
            )}
          </div>
        )}

        <div className="item-modal-section">
          <p className="item-modal-label">Your photos</p>
          <PhotoSlots slots={photos.slots} isLocked={isReturned} fileRefs={photos.fileRefs}
            onAddClick={photos.addFile} onRemoveNew={photos.removeNew} onRemoveExisting={photos.removeExisting} />
        </div>

        <div className="item-modal-section">
          <div className="item-modal-section-header">
            <p className="item-modal-label">{isReturned ? 'Report details' : 'Edit your report'}</p>
            {isReturned && <span className="item-modal-locked-text">Locked — item returned</span>}
          </div>
          <div className="item-modal-fields">
            <label className="item-modal-field-label" htmlFor="found-modal-what">Item found</label>
            <input id="found-modal-what" name="what_found" className="item-modal-input"
              value={form.what_found} onChange={handleChange} placeholder="e.g. keys, wallet, bag"
              disabled={true} readOnly={true} />
            <label className="item-modal-field-label" htmlFor="found-modal-desc">Description</label>
            <textarea id="found-modal-desc" name="item_desc" className="item-modal-input item-modal-textarea"
              value={form.item_desc} onChange={handleChange} placeholder="Describe the item" rows={3}
              disabled={isReturned} readOnly={isReturned} />
            <label className="item-modal-field-label" htmlFor="found-modal-location">Where found</label>
            <input id="found-modal-location" name="where_found" className="item-modal-input"
              value={form.where_found} onChange={handleChange} placeholder="Where did you find it?"
              disabled={isReturned} readOnly={isReturned} />
            <label className="item-modal-field-label" htmlFor="found-modal-date">Date found</label>
            <input id="found-modal-date" name="date_found" type="date" className="item-modal-input"
              value={form.date_found} onChange={handleChange}
              disabled={isReturned} readOnly={isReturned} />
            <label className="item-modal-field-label" htmlFor="found-modal-contact">Contact info</label>
            <input id="found-modal-contact" name="contact" className="item-modal-input"
              value={form.contact} onChange={handleChange} placeholder="Email or phone"
              disabled={isReturned} readOnly={isReturned} />
          </div>
          {saveError && <p className="item-modal-error">{saveError}</p>}
          {saveSuccess && <p className="item-modal-success">Saved!</p>}
        </div>

        {!isReturned && (
          <div className="item-modal-actions">
            <button type="button" className="item-modal-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Main AccountPage
══════════════════════════════════════════ */
export default function AccountPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('lost')
  const [loggingOut, setLoggingOut] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [lostItems, setLostItems] = useState([])
  const [foundItems, setFoundItems] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState(null)
  const [selectedLost, setSelectedLost] = useState(null)
  const [selectedFound, setSelectedFound] = useState(null)

  useEffect(() => {
  let cancelled = false
  supabase.auth.getUser()
    .then(async ({ data: { user: u } }) => {
      if (!cancelled) {
        setUser(u ?? null)
        if (u?.id) {
  const { data } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', u.id)
    .single()
  if (!cancelled && data?.name) {
    setUser(prev => prev ? { ...prev, _profileName: data.name } : prev)
  }
}
      }
    })
    .catch(() => { if (!cancelled) setUser(null) })
    .finally(() => { if (!cancelled) setLoading(false) })
  return () => { cancelled = true }
}, [])

  useEffect(() => {
    if (!user?.id) { setLostItems([]); setFoundItems([]); setReportsError(null); return }
    let cancelled = false
    setReportsLoading(true); setReportsError(null)

    const fetchData = async () => {
      try {
        const { data: lostData, error: lostError } = await supabase
          .from('lost_items')
          .select('id, what_lost, item_desc, lost_location, date_lost, status, matched_found_id, photo_url_1, photo_url_2, photo_url_3')
          .eq('user_id', user.id)

        if (cancelled) return
        if (lostError) { setReportsError(lostError.message); setLostItems([]) }
        else {
          const matchedIds = (lostData ?? []).map(r => r.matched_found_id).filter(Boolean)
          let finderMap = {}
          if (matchedIds.length > 0) {
            const { data: finderData } = await supabase
  .from('found_items')
  .select('id, name, contact, photo_url_1, photo_url_2, photo_url_3, user_id')
  .in('id', matchedIds)

if (!cancelled && finderData) {
  const finderUserIds = finderData.map(f => f.user_id).filter(Boolean)
  let finderProfileMap = {}
  if (finderUserIds.length > 0) {
    const { data: finderProfiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', finderUserIds)
    if (finderProfiles) finderProfiles.forEach(p => { finderProfileMap[p.id] = p.name })
  }
  finderData.forEach(f => {
    finderMap[f.id] = {
      ...f,
      name: finderProfileMap[f.user_id] ?? f.name ?? null,
    }
  })
}
          }
          if (!cancelled) {
            setLostItems((lostData ?? []).map(row => {
              const autoStatus = row.matched_found_id && row.status === 'searching' ? 'found' : row.status
              if (autoStatus !== row.status) supabase.from('lost_items').update({ status: autoStatus }).eq('id', row.id)
              return { ...row, status: autoStatus, finder: finderMap[row.matched_found_id] ?? null }
            }))
          }
        }

        const { data: foundData, error: foundError } = await supabase
          .from('found_items')
          .select('id, name, contact, what_found, item_desc, where_found, date_found, status, photo_url_1, photo_url_2, photo_url_3')
          .eq('user_id', user.id)

        if (cancelled) return
        if (foundError) { setReportsError(prev => prev ?? foundError.message); setFoundItems([]) }
        else {
          const foundIds = (foundData ?? []).map(r => r.id)
          let matchedLostMap = {}
          if (foundIds.length > 0) {
            const { data: matchedLostData } = await supabase
  .from('lost_items')
  .select('id, what_lost, name, contact, matched_found_id, user_id')
  .in('matched_found_id', foundIds)

if (!cancelled && matchedLostData) {
  const userIds = matchedLostData.map(l => l.user_id).filter(Boolean)
  let profileMap = {}
  if (userIds.length > 0) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds)
    if (profileData) profileData.forEach(p => { profileMap[p.id] = p.name })
  }

  matchedLostData.forEach(l => {
    matchedLostMap[l.matched_found_id] = {
      what_lost: l.what_lost,
      owner_name: profileMap[l.user_id] ?? l.name ?? null,
      owner_contact: l.contact ?? null,
    }
  })
}
          }
          if (!cancelled) {
            setFoundItems((foundData ?? []).map(row => ({
              ...row,
              matchedLost: matchedLostMap[row.id] ?? null,
            })))
          }
        }
      } catch {
        if (!cancelled) { setReportsError('Could not load your reports.'); setLostItems([]); setFoundItems([]) }
      } finally {
        if (!cancelled) setReportsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [user?.id])

const handleLostStatusChange = async (itemId, newStatus) => {
  const lostItem = lostItems.find(item => item.id === itemId)
  const matchedFoundId = lostItem?.matched_found_id ?? null

  setLostItems(prev => prev.map(item =>
    item.id === itemId ? { ...item, status: newStatus } : item
  ))
  setSelectedLost(prev => prev?.id === itemId ? { ...prev, status: newStatus } : prev)

  if (matchedFoundId) {
    // Map lost status → found status
    const foundStatus = newStatus === 'returned' ? 'returned' : 'holding'
    await supabase.from('found_items')
      .update({ status: foundStatus })
      .eq('id', Number(matchedFoundId))
    setFoundItems(prev => prev.map(item =>
      item.id === Number(matchedFoundId) ? { ...item, status: foundStatus } : item
    ))
  }
}

  const handleLostSave = (itemId, form) => {
    setLostItems(prev => prev.map(item => item.id === itemId ? { ...item, ...form } : item))
  }

  const handleNotMine = (itemId) => {
    setLostItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, matched_found_id: null, finder: null, status: 'searching' } : item
    ))
  }

  const handleFoundSave = (itemId, form) => {
    setFoundItems(prev => prev.map(item => item.id === itemId ? { ...item, ...form } : item))
  }

  const fullName = user?._profileName?.trim()
  || user?.user_metadata?.full_name?.trim()
  || user?.user_metadata?.name?.trim()
  || ''
  const email = user?.email ?? ''
  const displayName = fullName || email.split('@')[0] || 'Account'
  const initials = loading ? '…' : user ? getInitials(displayName) : '?'

  const lostReports = useMemo(() => lostItems.map(row => ({
    id: row.id,
    title: row.what_lost ?? '—',
    location: row.lost_location ?? '—',
    date: formatReportDate(row.date_lost),
    status: row.status ?? 'searching',
    finderName: row.finder?.name ?? null,
    finderContact: row.finder?.contact ?? null,
    hasMatch: !!row.matched_found_id,
    raw: row,
    finder: row.finder,
  })), [lostItems])

  const foundReports = useMemo(() => foundItems.map(row => ({
    id: row.id,
    title: row.what_found ?? '—',
    location: row.where_found ?? '—',
    date: formatReportDate(row.date_found),
    status: row.status ?? 'holding',
    hasMatch: !!row.matchedLost,
    matchedLost: row.matchedLost ?? null,
    raw: row,
  })), [foundItems])

  const handleLogout = async () => {
    setLoggingOut(true)
    try { await supabase.auth.signOut(); navigate('/') }
    catch { setLoggingOut(false) }
  }

  return (
    <div className="account-page">
      <div className="account-page-inner">
        <nav className="account-page-nav" aria-label="Account navigation">
          <Link to="/" className="account-page-back">← Home</Link>
        </nav>

        <header className="account-header" aria-busy={loading} aria-live="polite">
          <div className="account-header-left">
            <div className="account-avatar" aria-hidden="true">{initials}</div>
            <div className="account-header-text">
              <h1 id="account-profile-heading" className="account-name">
                {loading ? 'Loading…' : user ? displayName : 'Not signed in'}
              </h1>
              <p className="account-email">{loading ? '—' : user ? email : ''}</p>
            </div>
          </div>
          <button type="button" className="account-edit-btn"
            disabled={loading || !user} onClick={() => navigate('/edit-profile')}>
            Edit profile
          </button>
        </header>

        {!loading && !user && (
          <p style={{ marginTop: '0.75rem' }}>
            <Link to="/auth" className="account-page-back">Login / Sign up</Link>
          </p>
        )}

        {user && (
          <section className="account-dashboard" aria-labelledby="account-profile-heading">
            <div className="account-tabs" role="tablist" aria-label="Lost or found reports">
              <button type="button" role="tab" id="tab-lost"
                aria-selected={activeTab === 'lost'} aria-controls="account-reports-panel"
                className={`account-tab ${activeTab === 'lost' ? 'account-tab--active' : ''}`}
                onClick={() => setActiveTab('lost')}>
                Lost {lostReports.length > 0 && <span className="tab-count">{lostReports.length}</span>}
              </button>
              <button type="button" role="tab" id="tab-found"
                aria-selected={activeTab === 'found'} aria-controls="account-reports-panel"
                className={`account-tab ${activeTab === 'found' ? 'account-tab--active' : ''}`}
                onClick={() => setActiveTab('found')}>
                Found {foundReports.length > 0 && <span className="tab-count">{foundReports.length}</span>}
              </button>
            </div>

            <div id="account-reports-panel" role="tabpanel"
              aria-labelledby={activeTab === 'lost' ? 'tab-lost' : 'tab-found'}
              className="account-report-panel">
              {reportsError && <p className="account-email" role="alert">{reportsError}</p>}
              {reportsLoading && !reportsError && <p className="account-email">Loading reports…</p>}

              {activeTab === 'lost' && !reportsLoading && !reportsError && (
                lostReports.length === 0
                  ? <p className="account-email">No lost items yet.</p>
                  : <ul className="account-report-list">
                    {lostReports.map(report => (
                      <li key={report.id} className="account-report-card">
                        <div className="account-report-card-top">
                          <h2 className="account-report-title">{report.title}</h2>
                          <StatusBadge status={report.status} />
                        </div>
                        <dl className="account-report-meta">
                          <div className="account-report-meta-row"><dt>Location</dt><dd>{report.location}</dd></div>
                          <div className="account-report-meta-row"><dt>Date</dt><dd>{report.date}</dd></div>
                        </dl>
                        {report.finderContact && report.status !== 'returned' && (
                          <div className="finder-contact">
                            <p className="finder-contact-label">Someone found this! 🎉</p>
                            {report.finderName && <p className="finder-contact-name">{report.finderName}</p>}
                            <p className="finder-contact-value">{report.finderContact}</p>
                          </div>
                        )}
                        <div className="account-report-card-footer">
                          <button type="button" className="see-more-btn"
                            onClick={() => setSelectedLost(report)}>
                            {report.hasMatch ? 'See more' : 'Edit'}
                          </button>
                          <StatusSelect itemId={report.id} currentStatus={report.status}
                            onStatusChange={handleLostStatusChange} hasMatch={report.hasMatch} />
                        </div>
                      </li>
                    ))}
                  </ul>
              )}

              {activeTab === 'found' && !reportsLoading && !reportsError && (
                foundReports.length === 0
                  ? <p className="account-email">No found items yet.</p>
                  : <ul className="account-report-list">
                    {foundReports.map(report => (
                      <li key={report.id} className="account-report-card">
                        <div className="account-report-card-top">
                          <h2 className="account-report-title">{report.title}</h2>
                          {report.status === 'returned'
                            ? <StatusBadge status="returned" />
                            : report.hasMatch && <span className="status-badge status-badge--found">Matched</span>}
                        </div>
                        <dl className="account-report-meta">
                          <div className="account-report-meta-row"><dt>Location</dt><dd>{report.location}</dd></div>
                          <div className="account-report-meta-row"><dt>Date</dt><dd>{report.date}</dd></div>
                        </dl>
                        {report.hasMatch && report.matchedLost && report.status !== 'returned' && (
                          <div className="finder-contact">
                            <p className="finder-contact-label">Matched with a lost report! 🎉</p>
                            {report.matchedLost.what_lost && <p className="finder-contact-name">{report.matchedLost.what_lost}</p>}
                            {report.matchedLost.owner_name && <p className="finder-contact-value">{report.matchedLost.owner_name}</p>}
                            {report.matchedLost.owner_contact && <p className="finder-contact-value">{report.matchedLost.owner_contact}</p>}
                          </div>
                        )}
                        <div className="account-report-card-footer">
                          <button type="button" className="see-more-btn"
                            onClick={() => setSelectedFound(report)}>
                            {report.status === 'returned' ? 'View' : report.hasMatch ? 'See more' : 'Edit'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
              )}
            </div>
          </section>
        )}

        {user && (
          <div className="account-logout-wrap">
            <button type="button" className="account-logout-btn"
              onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        )}
      </div>

      {selectedLost && (
        <LostItemModal item={selectedLost} onClose={() => setSelectedLost(null)}
          onSave={handleLostSave} onNotMine={handleNotMine}
          onStatusChange={handleLostStatusChange} />
      )}

      {selectedFound && (
        <FoundItemModal item={selectedFound} onClose={() => setSelectedFound(null)}
          onSave={handleFoundSave} />
      )}
    </div>
  )
}