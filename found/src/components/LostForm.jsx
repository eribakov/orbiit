import { Fragment } from 'react'
import { supabase } from '...src/supabaseClient.js'

const FIELDS = [
  { id: 'name', name: 'name', label: 'Name', placeholder: 'Your name' },
  { id: 'contact', name: 'contact', label: 'Contact info', placeholder: 'Email or phone' },
  { id: 'what_lost', name: 'what_lost', label: 'What did you lose?', placeholder: 'e.g. keys, wallet, bag' },
  { id: "item_description", name: "item_description", label: "Item description", placeholder: "Give a brief descrription of your item including any distinguishing features" },
  { id: 'where_lost', name: 'where_lost', label: 'Where did you lose it?', placeholder: 'e.g. Central Park, bus line 42' },
]

export default function LostForm() {
  return (
    <form
      action={FORMSPREE_ENDPOINT}
      method="POST"
      className="lost-form"
    >
      {FIELDS.map(({ id, name, label, placeholder }) => (
        <Fragment key={id}>
          <label htmlFor={id}>{label}</label>
          <input
            id={id}
            name={name}
            type="text"
            required
            placeholder={placeholder}
          />
        </Fragment>
      ))}
      <button type="submit" className="lost-form-submit">
        Submit
      </button>
    </form>
  )
}
