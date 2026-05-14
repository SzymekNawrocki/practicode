import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function EntryNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Entry not found</h1>
      <p className="text-sm text-muted-foreground">
        This entry may have been removed or the link is incorrect.
      </p>
      <Button asChild variant="outline">
        <Link href="/#categories">Browse categories</Link>
      </Button>
    </div>
  )
}
