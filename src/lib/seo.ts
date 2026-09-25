/** Metadata adapters for records approved for public publication. */
type Publication = { published: boolean };
type Breadcrumb = { name: string; url: string };

export function breadcrumbStructuredData(items: Breadcrumb[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })) };
}

export function schoolStructuredData(school: Publication & { name: string; description: string; url: string; city: string; state: string; image?: string }) {
  if (!school.published) return null;
  return { "@context": "https://schema.org", "@type": "School", name: school.name, description: school.description, url: school.url, ...(school.image ? { image: school.image } : {}), address: { "@type": "PostalAddress", addressLocality: school.city, addressRegion: school.state, addressCountry: "NG" } };
}

export function locationStructuredData(location: Publication & { city: string; state: string; url: string }) {
  if (!location.published) return null;
  return { "@context": "https://schema.org", "@type": "Place", name: `${location.city}, ${location.state}`, url: location.url, address: { "@type": "PostalAddress", addressLocality: location.city, addressRegion: location.state, addressCountry: "NG" } };
}

export function reviewStructuredData(review: Publication & { publicAuthor: string; body: string; rating: number; date: string; schoolName: string }) {
  if (!review.published || !Number.isFinite(review.rating) || review.rating < 1 || review.rating > 5) return null;
  return { "@context": "https://schema.org", "@type": "Review", itemReviewed: { "@type": "School", name: review.schoolName }, author: { "@type": "Person", name: review.publicAuthor }, reviewBody: review.body, datePublished: review.date, reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 } };
}

export function serializeStructuredData(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
