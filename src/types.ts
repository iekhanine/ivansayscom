export type Category = 'developer' | 'creator' | 'artist'
export type Availability = 'available' | 'limited' | 'unavailable'
export type PersonStatus = 'draft' | 'published' | 'archived'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type JournalStatus = 'draft' | 'published'

export type Person = {
  id: string
  display_name: string
  slug: string
  category: Category
  role: string
  bio: string
  location: string | null
  timezone: string | null
  availability: Availability
  skills: string[]
  website_url: string | null
  github_url: string | null
  portfolio_url: string | null
  contact_url: string | null
  monogram: string | null
  sort_order: number
  status: PersonStatus
  is_featured: boolean
  featured_order: number
  featured_note: string | null
  curated_at: string | null
  created_at: string
  updated_at: string
}

export type Application = {
  id: string
  name: string
  email: string
  category: Category
  role: string
  location: string | null
  timezone: string | null
  availability: Availability
  primary_url: string
  secondary_url: string | null
  tertiary_url: string | null
  current_focus: string | null
  note: string | null
  status: ReviewStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export type Nomination = {
  id: string
  nominee_name: string
  nominee_role: string
  category: Category
  primary_url: string
  secondary_url: string | null
  why_nominate: string
  nominator_name: string
  nominator_email: string
  relationship: string | null
  status: ReviewStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export type Reviewer = {
  id: string
  display_name: string
  title: string
  bio: string
  specialties: string[]
  website_url: string | null
  monogram: string | null
  is_public: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type ReviewerAccess = {
  reviewer_id: string
  email: string
  user_id: string | null
  created_at: string
}

export type JournalEntry = {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  author_name: string
  status: JournalStatus
  published_at: string | null
  created_at: string
  updated_at: string
}
