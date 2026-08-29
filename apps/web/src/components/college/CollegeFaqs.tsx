'use client'

import { useState } from 'react'
import { HelpCircle, ChevronDown } from 'lucide-react'

interface FaqRow {
  id: string
  question: string
  answer: string
}

export default function CollegeFaqs({ faqs }: { faqs: FaqRow[] }) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null)

  if (faqs.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-indigo-500" />
        Frequently Asked Questions
      </h2>
      <div className="divide-y divide-gray-100">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id
          return (
            <div key={faq.id} className="py-3 first:pt-0 last:pb-0">
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full flex items-center justify-between gap-3 text-left"
              >
                <span className="text-sm font-medium text-gray-800">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <p className="text-sm text-gray-500 leading-relaxed mt-2 pr-6">
                  {faq.answer}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
