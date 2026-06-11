// src/admin/pages/Content.tsx
// Homepage content manager + Brand Story editor
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Image, Save, Loader2, Plus, Trash2, GripVertical, Link as LinkIcon } from 'lucide-react'
import {
  getHomepageContent, updateHomepageContent,
  getBrandStory, updateBrandStory,
} from '@/firebase/content'
import { getAllProductsAdmin } from '@/firebase/products'
import { useToast } from '@/components/shared/Toast'
import type { HomepageContent, BrandStory, HeroBanner, WhyChooseItem } from '@/types'

const FALLBACK_BANNERS: HeroBanner[] = [
  {
    id: 'b1',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1400&q=80',
    imageMobile: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
    title: 'Luxury Begins Here',
    subtitle: 'Premium cosmetics curated for the modern woman',
    ctaText: 'Explore Collection',
    ctaLink: '/catalog',
    order: 0,
    active: true,
  },
  {
    id: 'b2',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1400&q=80',
    imageMobile: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    title: 'Gift the Extraordinary',
    subtitle: 'Personalized luxury gifts that leave lasting impressions',
    ctaText: 'Shop Gifts',
    ctaLink: '/category/gifts',
    order: 1,
    active: true,
  },
  {
    id: 'b3',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=80',
    imageMobile: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    title: 'Step Into Elegance',
    subtitle: "Discover women's shoes that define your style",
    ctaText: 'Shop Shoes',
    ctaLink: '/category/shoes',
    order: 2,
    active: true,
  },
]

const TABS = ['Hero Banners', 'Product Sections', 'Why Choose Us', 'Brand Story'] as const
type Tab = typeof TABS[number]

// ── Hero Banner Editor ─────────────────────────────────────
function HeroBannerEditor({ banners, onChange }: {
  banners: HeroBanner[]
  onChange: (banners: HeroBanner[]) => void
}) {
  const addBanner = () => onChange([...banners, {
    id: Date.now().toString(),
    image: '', imageMobile: '', title: '', subtitle: '', ctaText: 'Shop Now', ctaLink: '/', order: banners.length, active: true,
  }])
  const updateBanner = (i: number, key: keyof HeroBanner, val: unknown) =>
    onChange(banners.map((b, j) => j === i ? { ...b, [key]: val } : b))
  const removeBanner = (i: number) => onChange(banners.filter((_, j) => j !== i))

  return (
    <div className="space-y-4">
      {banners.map((banner, i) => (
        <div key={banner.id} className="border border-[var(--border)] rounded-luxury-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <GripVertical size={16} className="text-[var(--text-muted)]" />
            <span className="font-sans text-sm font-semibold text-[var(--text-primary)]">Banner {i + 1}</span>
            <div className="ml-auto flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="font-sans text-xs text-[var(--text-muted)]">Active</span>
                <div
                  onClick={() => updateBanner(i, 'active', !banner.active)}
                  className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${banner.active ? 'bg-gradient-luxury' : 'bg-[var(--border)]'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${banner.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </label>
              <button onClick={() => removeBanner(i)} className="text-[var(--text-muted)] hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-xs text-[var(--text-muted)] block mb-1">Desktop Image URL</label>
              <input value={banner.image} onChange={(e) => updateBanner(i, 'image', e.target.value)} className="input-luxury text-sm py-2" placeholder="https://..." />
            </div>
            <div>
              <label className="font-sans text-xs text-[var(--text-muted)] block mb-1">Mobile Image URL</label>
              <input value={banner.imageMobile} onChange={(e) => updateBanner(i, 'imageMobile', e.target.value)} className="input-luxury text-sm py-2" placeholder="https://..." />
            </div>
            <div>
              <label className="font-sans text-xs text-[var(--text-muted)] block mb-1">Title</label>
              <input value={banner.title} onChange={(e) => updateBanner(i, 'title', e.target.value)} className="input-luxury text-sm py-2" placeholder="Banner title" />
            </div>
            <div>
              <label className="font-sans text-xs text-[var(--text-muted)] block mb-1">Subtitle</label>
              <input value={banner.subtitle} onChange={(e) => updateBanner(i, 'subtitle', e.target.value)} className="input-luxury text-sm py-2" placeholder="Banner subtitle" />
            </div>
            <div>
              <label className="font-sans text-xs text-[var(--text-muted)] block mb-1">CTA Text</label>
              <input value={banner.ctaText} onChange={(e) => updateBanner(i, 'ctaText', e.target.value)} className="input-luxury text-sm py-2" placeholder="Shop Now" />
            </div>
            <div>
              <label className="font-sans text-xs text-[var(--text-muted)] block mb-1">CTA Link</label>
              <input value={banner.ctaLink} onChange={(e) => updateBanner(i, 'ctaLink', e.target.value)} className="input-luxury text-sm py-2" placeholder="/category/cosmetics" />
            </div>
          </div>
          {banner.image && <img src={banner.image} alt="" className="w-full h-32 object-cover rounded-luxury" />}
        </div>
      ))}
      <button onClick={addBanner} className="w-full py-3 border-2 border-dashed border-[var(--border)] rounded-luxury-lg text-[var(--text-muted)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] transition-colors flex items-center justify-center gap-2 font-sans text-sm">
        <Plus size={15} /> Add Banner
      </button>
    </div>
  )
}

// ── Product Section Picker ─────────────────────────────────
function ProductIdList({ label, ids, onChange }: { label: string; ids: string[]; onChange: (ids: string[]) => void }) {
  const { data: allProducts = [] } = useQuery({
    queryKey: ['products', 'admin', 'all'],
    queryFn: async () => {
      const result = await getAllProductsAdmin()
      return result.products
    },
  })
  const products = allProducts
  const addId = (id: string) => { if (!ids.includes(id)) onChange([...ids, id]) }
  const removeId = (id: string) => onChange(ids.filter((i) => i !== id))
  const [search, setSearch] = useState('')
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 30)

  return (
    <div className="space-y-3">
      <h3 className="font-sans text-sm font-semibold text-[var(--text-secondary)]">{label}</h3>
      {/* Current IDs */}
      <div className="flex flex-wrap gap-2">
        {ids.map((id) => {
          const product = products.find((p) => p.id === id)
          return (
            <div key={id} className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-muted)] rounded-full">
              {product?.featuredImage && <img src={product.featuredImage} alt="" className="w-4 h-4 rounded-full object-cover" />}
              <span className="font-sans text-xs text-[var(--text-primary)]">{product?.name ?? id}</span>
              <button onClick={() => removeId(id)}><X size={10} className="text-[var(--text-muted)]" /></button>
            </div>
          )
        })}
      </div>
      {/* Search & add */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-luxury text-sm py-2"
        placeholder="Search products to add..."
      />
      {search && (
        <div className="border border-[var(--border)] rounded-luxury max-h-40 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => { addId(p.id); setSearch('') }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-muted)] text-left"
            >
              <img src={p.featuredImage} alt="" className="w-7 h-7 rounded object-cover" />
              <span className="font-sans text-sm text-[var(--text-primary)]">{p.name}</span>
              {ids.includes(p.id) && <span className="ml-auto font-sans text-xs text-emerald-600">Added</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Why Choose Us Editor ───────────────────────────────────
const ICON_OPTIONS = ['✨', '🌸', '💎', '🚚', '🔒', '💝', '🌿', '⭐', '🎁', '👑']

function WhyChooseEditor({ items, onChange }: { items: WhyChooseItem[]; onChange: (items: WhyChooseItem[]) => void }) {
  const add = () => onChange([...items, { icon: '✨', title: '', description: '' }])
  const update = (i: number, key: keyof WhyChooseItem, val: string) =>
    onChange(items.map((item, j) => j === i ? { ...item, [key]: val } : item))
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i))

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 p-3 border border-[var(--border)] rounded-luxury-lg">
          <select value={item.icon} onChange={(e) => update(i, 'icon', e.target.value)} className="input-luxury w-16 text-xl text-center p-1">
            {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
          </select>
          <div className="flex-1 space-y-2">
            <input value={item.title} onChange={(e) => update(i, 'title', e.target.value)} className="input-luxury text-sm py-2" placeholder="Title" />
            <input value={item.description} onChange={(e) => update(i, 'description', e.target.value)} className="input-luxury text-sm py-2" placeholder="Description" />
          </div>
          <button onClick={() => remove(i)} className="text-[var(--text-muted)] hover:text-red-500 self-start"><Trash2 size={14} /></button>
        </div>
      ))}
      <button onClick={add} className="w-full py-2.5 border-2 border-dashed border-[var(--border)] rounded-luxury text-[var(--text-muted)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] transition-colors flex items-center justify-center gap-2 font-sans text-sm">
        <Plus size={14} /> Add Item
      </button>
    </div>
  )
}

// ── X component ────────────────────────────────────────────
function X({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function Content() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('Hero Banners')

  const { data: homepage } = useQuery({ queryKey: ['content', 'homepage'], queryFn: getHomepageContent })
  const { data: brandStory } = useQuery({ queryKey: ['content', 'brandstory'], queryFn: getBrandStory })

  const [hp, setHp] = useState<Partial<HomepageContent>>({})
  const [bs, setBs] = useState<Partial<BrandStory>>({})

  // Sync from server data when loaded
  const hpData: HomepageContent = {
    heroBanners: [], featuredProductIds: [], newArrivalProductIds: [],
    bestSellerProductIds: [], trendingProductIds: [], flashSaleId: null,
    whyChooseUs: [], updatedAt: null as never,
    ...homepage, ...hp,
  }
  const bsData: BrandStory = {
    title: '', subtitle: '', content: '', image: '', updatedAt: null as never,
    ...brandStory, ...bs,
  }

  const { mutate: saveHomepage, isPending: savingHp } = useMutation({
    // Save the FULLY MERGED object (server defaults + local edits) — not just the diff
    mutationFn: () => updateHomepageContent(hpData),
    onSuccess: () => { toast('Homepage content saved!', 'success'); qc.invalidateQueries({ queryKey: ['content', 'homepage'] }) },
    onError: () => toast('Failed to save', 'error'),
  })

  const { mutate: saveBrandStory, isPending: savingBs } = useMutation({
    // Save the FULLY MERGED object — not just the diff
    mutationFn: () => updateBrandStory(bsData),
    onSuccess: () => { toast('Brand story saved!', 'success'); qc.invalidateQueries({ queryKey: ['content', 'brandstory'] }) },
    onError: () => toast('Failed to save', 'error'),
  })

  const renderTab = () => {
    switch (activeTab) {
      case 'Hero Banners':
        return (
          <div className="space-y-5">
            <HeroBannerEditor
              banners={hpData.heroBanners ?? []}
              onChange={(banners) => setHp((h) => ({ ...homepage, ...h, heroBanners: banners }))}
            />
            <div className="flex flex-wrap gap-3">
              <button onClick={() => saveHomepage()} disabled={savingHp} className="btn-primary gap-2">
                {savingHp ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Banners
              </button>
              <button 
                onClick={() => setHp((h) => ({ ...homepage, ...h, heroBanners: FALLBACK_BANNERS }))} 
                className="btn-secondary gap-2"
              >
                Set Default Banners
              </button>
            </div>
          </div>
        )
      case 'Product Sections':
        return (
          <div className="space-y-6">
            {([
              { key: 'featuredProductIds', label: 'Featured Products' },
              { key: 'newArrivalProductIds', label: 'New Arrivals' },
              { key: 'bestSellerProductIds', label: 'Best Sellers' },
              { key: 'trendingProductIds', label: 'Trending Now' },
            ] as { key: keyof HomepageContent; label: string }[]).map(({ key, label }) => (
              <div key={key} className="bg-[var(--bg-surface)] rounded-luxury-lg border border-[var(--border)] p-4">
                <ProductIdList
                  label={label}
                  ids={(hpData[key] as string[]) ?? []}
                  onChange={(ids) => setHp((h) => ({ ...homepage, ...h, [key]: ids }))}
                />
              </div>
            ))}
            <button onClick={() => saveHomepage()} disabled={savingHp} className="btn-primary gap-2">
              {savingHp ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Product Sections
            </button>
          </div>
        )
      case 'Why Choose Us':
        return (
          <div className="space-y-4">
            <WhyChooseEditor
              items={hpData.whyChooseUs ?? []}
              onChange={(items) => setHp((h) => ({ ...homepage, ...h, whyChooseUs: items }))}
            />
            <button onClick={() => saveHomepage()} disabled={savingHp} className="btn-primary gap-2">
              {savingHp ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
            </button>
          </div>
        )
      case 'Brand Story':
        return (
          <div className="space-y-4">
            <div>
              <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Title</label>
              <input value={bsData.title} onChange={(e) => setBs((b) => ({ ...brandStory, ...b, title: e.target.value }))} className="input-luxury" placeholder="Our Story" />
            </div>
            <div>
              <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Subtitle</label>
              <input value={bsData.subtitle} onChange={(e) => setBs((b) => ({ ...brandStory, ...b, subtitle: e.target.value }))} className="input-luxury" placeholder="Born from a love of beauty" />
            </div>
            <div>
              <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Content</label>
              <textarea value={bsData.content} onChange={(e) => setBs((b) => ({ ...brandStory, ...b, content: e.target.value }))} className="input-luxury resize-none" rows={6} placeholder="Your brand story..." />
            </div>
            <div>
              <label className="font-sans text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Image URL</label>
              <input value={bsData.image} onChange={(e) => setBs((b) => ({ ...brandStory, ...b, image: e.target.value }))} className="input-luxury" placeholder="https://..." />
              {bsData.image && <img src={bsData.image} alt="" className="mt-2 w-full h-40 object-cover rounded-luxury" />}
            </div>
            <button onClick={() => saveBrandStory()} disabled={savingBs} className="btn-primary gap-2">
              {savingBs ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Brand Story
            </button>
          </div>
        )
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Content Manager</h1>
        <p className="font-sans text-sm text-[var(--text-muted)] mt-0.5">Manage homepage content, banners, and brand story</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)] mb-6 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-sans text-sm font-medium whitespace-nowrap transition-colors relative ${
              activeTab === tab ? 'text-[var(--color-rose)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="content-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-luxury" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-[var(--bg-surface)] rounded-luxury-xl border border-[var(--border)] p-5 sm:p-6">
        {renderTab()}
      </div>
    </motion.div>
  )
}
