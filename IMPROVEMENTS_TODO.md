# Improvements to Implement

## 1. Loading States ✅
- Created `LoadingSkeleton.tsx` component with skeleton loaders
- Components: CardSkeleton, ListSkeleton, PageSkeleton, HeroSkeleton, StatSkeleton
- Usage: Add to pages that fetch data (careers, colleges, exams, scholarships)

### How to Use:
```tsx
import { ListSkeleton } from '@/components/LoadingSkeleton'

// In data-fetching pages
const [loading, setLoading] = useState(true)
if (loading) return <ListSkeleton />
```

---

## 2. Accessibility (A11y) Improvements

### ARIA Labels
Add to all interactive elements:
- Links: `aria-label="Navigate to careers"`
- Buttons: `aria-label="Save career to favorites"`
- Forms: `aria-label="Search careers"`
- Modals: `aria-modal="true"`, `aria-labelledby="modal-title"`

### Keyboard Navigation
- Add `tabIndex={0}` to interactive divs
- Handle Enter/Space key events
- Ensure focus management in modals
- Skip to main content link

### Color Contrast
- Ensure text contrast ratio ≥ 4.5:1
- Use accessible color palettes
- Don't rely on color alone for meaning

### Example Implementation:
```tsx
<button
  aria-label="Save career to favorites"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleSave()
    }
  }}
>
  <Heart />
</button>
```

---

## 3. SEO Optimization

### Dynamic Metadata
Add to all dynamic routes:

```tsx
// In careers/[slug]/page.tsx
export async function generateMetadata({ params }: Props) {
  const career = await getCareer(params.slug)
  return {
    title: `${career.title} - Career Path Guide`,
    description: career.description,
    openGraph: {
      title: career.title,
      description: career.description,
      type: 'website',
    },
  }
}
```

### Sitemap Generation
Create `app/sitemap.ts`:
```tsx
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://careerguide.com',
      lastModified: new Date(),
    },
    {
      url: 'https://careerguide.com/careers',
      lastModified: new Date(),
    },
    // Add all routes
  ]
}
```

### Robots.txt
Create `app/robots.ts`:
```tsx
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://careerguide.com/sitemap.xml',
  }
}
```

---

## 4. Performance Optimization

### Image Optimization
Replace all `<img>` with Next.js Image:
```tsx
import Image from 'next/image'

<Image
  src={career.image_url}
  alt={career.title}
  width={400}
  height={300}
  className="rounded-lg"
/>
```

### Caching Strategy
Add to API routes:
```tsx
export const revalidate = 3600 // 1 hour
// or
export const dynamic = 'force-dynamic'
```

### Code Splitting
Use dynamic imports for heavy components:
```tsx
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <ChartSkeleton />,
})
```

### Database Query Optimization
- Add indexes to frequently queried columns
- Use select() to only fetch needed columns
- Implement pagination for large datasets

---

## 5. Input Validation with Zod

### Create Schemas
Create `lib/schemas.ts`:
```tsx
import { z } from 'zod'

export const profileSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  state: z.string().min(2),
  stream: z.string().optional(),
  class_level: z.enum(['10', '12', 'graduate']),
})

export const careerSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.string(),
  avg_salary_min: z.number().min(0),
  avg_salary_max: z.number().min(0),
})
```

### Use in Forms
```tsx
import { profileSchema } from '@/lib/schemas'

const handleSubmit = (data: FormData) => {
  const result = profileSchema.safeParse(Object.fromEntries(data))
  if (!result.success) {
    // Show validation errors
    return
  }
  // Submit data
}
```

---

## Priority Order

1. **SEO Optimization** - High impact, quick to implement
2. **Image Optimization** - High impact, improves performance
3. **Input Validation** - Improves data quality
4. **Accessibility** - Important for inclusivity
5. **Loading States** - Already created, just need to integrate

---

## Next Steps

1. Start with SEO (sitemap, robots.txt, dynamic metadata)
2. Replace all images with Next.js Image component
3. Add Zod validation to forms
4. Add ARIA labels to key interactive elements
5. Integrate loading skeletons into data-fetching pages
