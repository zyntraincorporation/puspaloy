// src/admin/pages/Products/ProductForm.tsx
// Add / Edit product form with full field set + Firebase Storage upload + AI description
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Upload, X, Plus, Loader2, Save,
  Sparkles, Video, ImagePlus, GripVertical, Eye,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getProductById, createProduct, updateProduct } from '@/firebase/products'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/shared/Toast'
import { generateSlug } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import type { Product, ProductCategory, ProductStatus } from '@/types'

type FormValues = {
  name: string
  slug: string
  sku: string
  category: string
  additionalCategories: string[]
  subcategory: string
  tags: string
  price: string
  discountPrice: string
  stock: string
  status: ProductStatus
  featured: boolean
  newArrival: boolean
  bestSeller: boolean
  trending: boolean
  description: string
  htmlDescription: string
  youtubeVideoId: string
  messengerText: string
  whatsappText: string
  featuredImage: string
  images: string[]
}

const EMPTY_FORM: FormValues = {
  name: '', slug: '', sku: '', category: '', additionalCategories: [], subcategory: '',
  tags: '', price: '', discountPrice: '', stock: '', status: 'active',
  featured: false, newArrival: false, bestSeller: false, trending: false,
  description: '', htmlDescription: '', youtubeVideoId: '',
  messengerText: '', whatsappText: '',
  featuredImage: '', images: [],
}

import { useAllCategories } from '@/hooks/useCategories'

// ── Image Uploader ─────────────────────────────────────────
function ImageUploader({
  label, value, onChange, folder,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  folder: string
}) {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setProgress(20) // Simulated progress for API upload
    try {
      const apiKey = import.meta.env.VITE_IMGBB_API_KEY
      if (!apiKey) throw new Error('ImgBB API key is missing. Add VITE_IMGBB_API_KEY to your .env file.')

      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      if (data.success) {
        setProgress(100)
        onChange(data.data.url)
      } else {
        throw new Error(data.error?.message || 'Upload failed')
      }
    } catch (err: any) {
      console.error('ImgBB Upload Error:', err)
      alert(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div>
      <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-2">{label}</label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="w-32 h-32 rounded-luxury object-cover border border-[var(--border)]" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-32 h-32 rounded-luxury border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span className="text-xs">{Math.round(progress)}%</span>
            </>
          ) : (
            <>
              <ImagePlus size={20} />
              <span className="text-xs">Upload</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  )
}

// ── Multi-image uploader ───────────────────────────────────
function GalleryUploader({
  images, onChange,
}: {
  images: string[]
  onChange: (imgs: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY
    if (!apiKey) {
      alert('ImgBB API key is missing. Add VITE_IMGBB_API_KEY to your .env file.')
      setUploading(false)
      return
    }

    const uploads = Array.from(files).slice(0, 10 - images.length).map(async (file) => {
      const formData = new FormData()
      formData.append('image', file)
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error?.message || 'Upload failed')
      return data.data.url as string
    })

    try {
      const urls = await Promise.all(uploads)
      onChange([...images, ...urls])
    } catch (err) {
      console.error('ImgBB Gallery Upload Error:', err)
      alert('Failed to upload one or more images')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((img, i) => (
          <div key={i} className="relative">
            <img src={img} alt="" className="w-20 h-20 rounded-luxury object-cover border border-[var(--border)]" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {images.length < 10 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-luxury border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:border-[var(--color-rose)] transition-colors"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            <span className="text-[10px]">Add</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <p className="font-sans text-xs text-[var(--text-muted)]">{images.length}/10 images. First image = featured if no featured image set.</p>
    </div>
  )
}

// ── AI Description Generator ───────────────────────────────
function AIDescriptionButton({
  productName, category, onGenerated,
}: {
  productName: string
  category: string
  onGenerated: (desc: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const generate = async () => {
    if (!productName.trim()) {
      toast('Enter product name first', 'error')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/.netlify/functions/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, category }),
      })
      
      if (!response.ok) {
        throw new Error('API Error')
      }
      
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content ?? ''
      if (content) {
        onGenerated(content)
        toast('AI description generated!', 'success')
      }
    } catch {
      toast('Failed to generate description', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-luxury bg-gradient-to-r from-violet-500 to-purple-600 text-white font-sans text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
      {loading ? 'Generating...' : 'Generate with AI'}
    </button>
  )
}

// ── Main Form ──────────────────────────────────────────────
export default function ProductForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { adminUser } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const { data: categories = [] } = useAllCategories()

  const { data: existing, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        slug: existing.slug,
        sku: existing.sku,
        category: existing.category,
        additionalCategories: existing.additionalCategories ?? [],
        subcategory: existing.subcategory ?? '',
        tags: existing.tags?.join(', ') ?? '',
        price: String(existing.price),
        discountPrice: existing.discountPrice ? String(existing.discountPrice) : '',
        stock: String(existing.stock),
        status: existing.status,
        featured: existing.featured,
        newArrival: existing.newArrival,
        bestSeller: existing.bestSeller,
        trending: existing.trending,
        description: existing.description ?? '',
        htmlDescription: existing.htmlDescription ?? '',
        youtubeVideoId: existing.youtubeVideoId ?? '',
        messengerText: existing.messengerText ?? '',
        whatsappText: existing.whatsappText ?? '',
        featuredImage: existing.featuredImage ?? '',
        images: existing.images ?? [],
      })
    }
  }, [existing])

  const set = (field: keyof FormValues, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.featuredImage) {
      toast('Name, price and featured image are required', 'error')
      return
    }
    if (!form.category) {
      toast('Please select a primary category', 'error')
      return
    }
    setSaving(true)
    try {
      const categorySlugs = Array.from(
        new Set([form.category, ...form.additionalCategories].filter(Boolean))
      )

      const payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        name: form.name.trim(),
        slug: form.slug || generateSlug(form.name),
        sku: form.sku.trim(),
        category: form.category,
        additionalCategories: form.additionalCategories,
        categorySlugs,
        subcategory: form.subcategory.trim(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        stock: Number(form.stock) || 0,
        status: form.status,
        featured: form.featured,
        newArrival: form.newArrival,
        bestSeller: form.bestSeller,
        trending: form.trending,
        featuredImage: form.featuredImage,
        images: form.images,
        description: form.description.trim(),
        htmlDescription: form.htmlDescription.trim(),
        youtubeVideoId: form.youtubeVideoId.trim() || null,
        flashSaleId: isEdit ? (existing?.flashSaleId ?? null) : null,
        flashSalePrice: isEdit ? (existing?.flashSalePrice ?? null) : null,
        messengerText: form.messengerText.trim(),
        whatsappText: form.whatsappText.trim(),
        createdBy: adminUser?.uid ?? '',
        avgRating: isEdit ? (existing?.avgRating ?? 0) : 0,
        reviewCount: isEdit ? (existing?.reviewCount ?? 0) : 0,
        salesCount: isEdit ? (existing?.salesCount ?? 0) : 0,
        viewCount: isEdit ? (existing?.viewCount ?? 0) : 0,
      }

      if (isEdit) {
        await updateProduct(id!, payload)
        toast('Product updated!', 'success')
      } else {
        await createProduct(payload)
        toast('Product created!', 'success')
        navigate('/admin/products')
      }
    } catch (err) {
      console.error(err)
      toast('Failed to save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[var(--color-rose)]" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/admin/products')} className="btn-ghost p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          {isEdit && <p className="font-sans text-sm text-[var(--text-muted)] mt-0.5">ID: {id}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left: Main fields ──────────────────────────── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Basic info */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 space-y-4">
              <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Basic Information</h2>
              <div>
                <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Product Name *</label>
                <input
                  type="text" value={form.name}
                  onChange={(e) => {
                    set('name', e.target.value)
                    if (!isEdit) set('slug', generateSlug(e.target.value))
                  }}
                  className="input-luxury" placeholder="e.g. Rose Glow Face Serum" required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Slug</label>
                  <input type="text" value={form.slug} onChange={(e) => set('slug', e.target.value)} className="input-luxury font-mono text-sm" placeholder="auto-generated" />
                </div>
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">SKU</label>
                  <input type="text" value={form.sku} onChange={(e) => set('sku', e.target.value)} className="input-luxury font-mono text-sm" placeholder="e.g. CSM-001" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                    Primary Category *
                    <span className="ml-1 text-[10px] text-[var(--color-rose)] font-normal">(required — main category)</span>
                  </label>
                  <select 
                    value={form.category}
                    onChange={(e) => {
                      set('category', e.target.value)
                      // Remove from additionalCategories if it was there
                      set('additionalCategories', form.additionalCategories.filter(s => s !== e.target.value))
                    }}
                    className="input-luxury pr-10 appearance-none bg-no-repeat"
                    style={{ backgroundImage: 'none' }}
                  >
                    <option value="" disabled>Select primary category</option>
                    {categories.filter(c => !c.archived && c.slug !== 'uncategorized').map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.icon && !c.icon.startsWith('http') ? c.icon + ' ' : ''}{c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                    Additional Categories
                    <span className="ml-1 text-[10px] text-[var(--text-muted)] font-normal">(optional — product appears in all selected)</span>
                  </label>
                  <div className="max-h-44 overflow-y-auto border border-[var(--border)] rounded-luxury p-2 space-y-1 bg-[var(--bg-surface)]">
                    {categories
                      .filter(c => !c.archived && c.slug !== 'uncategorized' && c.slug !== form.category)
                      .map((c) => {
                        const checked = form.additionalCategories.includes(c.slug)
                        return (
                          <label key={c.id} className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded hover:bg-[var(--bg-muted)] transition-colors">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  set('additionalCategories', [...form.additionalCategories, c.slug])
                                } else {
                                  set('additionalCategories', form.additionalCategories.filter(s => s !== c.slug))
                                }
                              }}
                              className="rounded accent-[var(--color-rose)]"
                            />
                            <span className="font-sans text-sm text-[var(--text-primary)]">
                              {c.icon && !c.icon.startsWith('http') ? c.icon + ' ' : ''}{c.name}
                            </span>
                          </label>
                        )
                      })
                    }
                    {categories.filter(c => !c.archived && c.slug !== 'uncategorized' && c.slug !== form.category).length === 0 && (
                      <p className="text-xs text-[var(--text-muted)] p-2">No other categories available.</p>
                    )}
                  </div>
                  {form.additionalCategories.length > 0 && (
                    <p className="font-sans text-xs text-[var(--text-muted)] mt-1.5">
                      ✓ Product will also appear in: {form.additionalCategories.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Subcategory</label>
                  <input type="text" value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)} className="input-luxury" placeholder="e.g. Serums" />
                </div>
              </div>
              <div>
                <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Tags (comma separated)</label>
                <input type="text" value={form.tags} onChange={(e) => set('tags', e.target.value)} className="input-luxury" placeholder="skincare, glow, serum" />
              </div>
            </div>

            {/* Pricing & inventory */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 space-y-4">
              <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Pricing & Inventory</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Price ৳ *</label>
                  <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} className="input-luxury" placeholder="0" min="0" required />
                </div>
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Discount Price ৳</label>
                  <input type="number" value={form.discountPrice} onChange={(e) => set('discountPrice', e.target.value)} className="input-luxury" placeholder="optional" min="0" />
                </div>
                <div>
                  <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} className="input-luxury" placeholder="0" min="0" />
                </div>
              </div>
              <div>
                <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value as ProductStatus)} className="input-luxury">
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Description</h2>
                <AIDescriptionButton
                  productName={form.name}
                  category={form.category}
                  onGenerated={(html) => {
                    set('htmlDescription', html)
                    const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
                    set('description', plain.slice(0, 500))
                  }}
                />
              </div>
              <div>
                <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Short Description (plain text)</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="input-luxury resize-none" rows={3} placeholder="Brief description for SEO and previews" />
              </div>
              <div>
                <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5 flex items-center gap-2">
                  <span>Full HTML Description</span>
                  <span className="text-xs font-normal text-[var(--color-rose)] ml-auto flex items-center gap-1">
                    <Sparkles size={12} /> Auto-generated by AI
                  </span>
                </label>
                <textarea value={form.htmlDescription} onChange={(e) => set('htmlDescription', e.target.value)} className="input-luxury resize-none font-mono text-xs" rows={8} placeholder="<p>Your HTML description here...</p>" />
              </div>
              
              {form.htmlDescription && (
                <div className="bg-white rounded-luxury border border-[var(--border)] overflow-hidden">
                  <div className="bg-[var(--bg-muted)] border-b border-[var(--border)] px-4 py-2 flex items-center gap-2">
                    <Eye size={14} className="text-[var(--text-secondary)]" />
                    <span className="font-sans text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Live Preview</span>
                  </div>
                  <div 
                    className="p-4 max-h-[500px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: form.htmlDescription }}
                  />
                </div>
              )}
            </div>

            {/* Social order links */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 space-y-4">
              <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Social Order Links</h2>
              <div>
                <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">WhatsApp Number</label>
                <input type="text" value={form.whatsappText} onChange={(e) => set('whatsappText', e.target.value)} className="input-luxury" placeholder="e.g. 8801XXXXXXXXX" />
              </div>
              <div>
                <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Messenger Page ID</label>
                <input type="text" value={form.messengerText} onChange={(e) => set('messengerText', e.target.value)} className="input-luxury" placeholder="e.g. puspaloy" />
              </div>
              <div>
                <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5 flex items-center gap-2">
                  <Video size={14} className="text-red-500" /> YouTube Video ID
                </label>
                <input type="text" value={form.youtubeVideoId} onChange={(e) => set('youtubeVideoId', e.target.value)} className="input-luxury font-mono text-sm" placeholder="e.g. dQw4w9WgXcQ (video ID only)" />
              </div>
            </div>
          </div>

          {/* ── Right: Media + Flags ───────────────────────── */}
          <div className="space-y-5">

            {/* Featured image */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5">
              <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Featured Image *</h2>
              <ImageUploader
                label="" value={form.featuredImage}
                onChange={(url) => set('featuredImage', url)}
                folder="products/featured"
              />
            </div>

            {/* Gallery */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5">
              <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Product Gallery</h2>
              <GalleryUploader images={form.images} onChange={(imgs) => set('images', imgs)} />
            </div>

            {/* Flags */}
            <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5">
              <h2 className="font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Product Flags</h2>
              <div className="space-y-3">
                {([
                  { key: 'featured', label: 'Featured Product', desc: 'Show on homepage featured section' },
                  { key: 'newArrival', label: 'New Arrival', desc: 'Show in new arrivals section' },
                  { key: 'bestSeller', label: 'Best Seller', desc: 'Show in best sellers section' },
                  { key: 'trending', label: 'Trending', desc: 'Show in trending section' },
                ] as const).map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => set(key, !form[key])}
                      className={cn(
                        'w-10 h-5 rounded-full relative transition-colors duration-200 cursor-pointer shrink-0',
                        form[key] ? 'bg-gradient-luxury' : 'bg-[var(--border-strong)]'
                      )}
                    >
                      <div className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                        form[key] ? 'translate-x-5' : 'translate-x-0.5'
                      )} />
                    </div>
                    <div>
                      <p className="font-sans text-sm font-medium text-[var(--text-primary)]">{label}</p>
                      <p className="font-sans text-xs text-[var(--text-muted)]">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Save */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={saving}
              className="w-full btn-primary py-4 gap-2 text-base"
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={16} /> {isEdit ? 'Save Changes' : 'Create Product'}</>
              )}
            </motion.button>
          </div>
        </div>
      </form>
    </motion.div>
  )
}
