import { Plus, X } from 'lucide-react'
import './DynamicListInput.css'

interface DynamicListInputProps {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}

const DynamicListInput = ({ label, items, onChange, placeholder = 'Add item...' }: DynamicListInputProps) => {
  const handleAdd = () => {
    onChange([...items, ''])
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    onChange(newItems)
  }

  return (
    <div className="dynamic-list-input">
      <label className="form-label">{label}</label>
      <div className="list-items">
        {items.map((item, index) => (
          <div key={index} className="list-item">
            <input
              type="text"
              className="form-input"
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={placeholder}
            />
            <button
              type="button"
              className="button-icon button-danger-subtle"
              onClick={() => handleRemove(index)}
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="button button-secondary" onClick={handleAdd}>
        <Plus size={18} />
        Add {label}
      </button>
    </div>
  )
}

export default DynamicListInput
