import { useState } from 'react'
import { Upload, X, Star } from 'lucide-react'
import './ImageManager.css'

interface ImageManagerProps {
  images: string[]
  defaultImage?: string
  onChange: (images: string[], defaultImage?: string) => void
  maxImages?: number
}

const ImageManager = ({ images, defaultImage, onChange, maxImages = 10 }: ImageManagerProps) => {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const newImages: string[] = []

      for (let i = 0; i < files.length; i++) {
        if (images.length + newImages.length >= maxImages) break

        const file = files[i]
        if (!file.type.startsWith('image/')) continue

        // Convert to data URL (base64)
        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        newImages.push(dataUrl)
      }

      const updatedImages = [...images, ...newImages]
      const newDefault = defaultImage || updatedImages[0]
      onChange(updatedImages, newDefault)
    } catch (error) {
      console.error('Error uploading images:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    const imageToRemove = images[index]
    const updatedImages = images.filter((_, i) => i !== index)

    let newDefault = defaultImage
    if (imageToRemove === defaultImage) {
      newDefault = updatedImages[0] || undefined
    }

    onChange(updatedImages, newDefault)
  }

  const handleSetDefault = (image: string) => {
    onChange(images, image)
  }

  return (
    <div className="image-manager">
      <div className="image-grid">
        {images.map((image, index) => (
          <div
            key={index}
            className={`image-item ${image === defaultImage ? 'default' : ''}`}
          >
            <img src={image} alt={`Product ${index + 1}`} />
            <div className="image-overlay">
              <button
                type="button"
                className="image-action set-default"
                onClick={() => handleSetDefault(image)}
                title="Set as default"
              >
                <Star size={16} fill={image === defaultImage ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                className="image-action remove"
                onClick={() => handleRemoveImage(index)}
                title="Remove"
              >
                <X size={16} />
              </button>
            </div>
            {image === defaultImage && (
              <div className="default-badge">Default</div>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <label className="image-upload">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <div className="upload-placeholder">
              <Upload size={24} />
              <span>{uploading ? 'Uploading...' : 'Add Images'}</span>
            </div>
          </label>
        )}
      </div>

      {images.length === 0 && (
        <p className="image-hint">
          Click "Add Images" to upload product/service images. The first image will be set as default.
        </p>
      )}
    </div>
  )
}

export default ImageManager
