import { DemoExperience } from './demo-experience'
import { getMarketingYear } from '@/lib/marketing-year'

// Re-render daily so the sample year cannot freeze at build time
export const revalidate = 86400

export default function DemoPage() {
  return <DemoExperience year={getMarketingYear(new Date())} />
}
