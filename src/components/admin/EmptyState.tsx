import { Inbox } from 'lucide-react'

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <Inbox className="mx-auto text-[#235b3e]" size={34} aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-[#17202d]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{text}</p>
    </div>
  )
}
