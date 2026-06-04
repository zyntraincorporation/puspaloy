// src/components/product/ProductTabs.tsx
// Tabbed section: Description | Reviews | How to Use
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface ProductTabsProps {
  tabs: Tab[]
}

export default function ProductTabs({ tabs }: ProductTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id ?? '')

  return (
    <div>
      {/* Tab headers */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'relative px-5 py-3 font-sans text-sm font-medium whitespace-nowrap transition-colors duration-200',
              active === tab.id
                ? 'text-[var(--color-rose)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            {tab.label}
            {active === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-luxury rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="pt-6"
        >
          {tabs.find((t) => t.id === active)?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
