type FilterOption = {
  label: string
  options: string[]
}

export function AdminFilters({ searchLabel = 'Buscar', filters = [] }: { searchLabel?: string; filters?: FilterOption[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          {searchLabel}
          <input
            type="search"
            className="rounded-md border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-[#235b3e]"
            placeholder="Sin datos conectados"
          />
        </label>
        {filters.map((filter) => (
          <label key={filter.label} className="grid gap-2 text-sm font-medium text-slate-700">
            {filter.label}
            <select className="rounded-md border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-[#235b3e]">
              <option>Todos</option>
              {filter.options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  )
}
