import { User } from 'lucide-react'

interface TraderLayer {
  layer: string
  tradersReferred: number
  points: number
}

const mockData: TraderLayer[] = [
  { layer: 'L1', tradersReferred: 12, points: 123 },
  { layer: 'L2', tradersReferred: 123, points: 123 },
  { layer: 'L3', tradersReferred: 1234, points: 123 },
]

export function ReferralTree() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Tree Visualization */}
      <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-6">
        <TreeVisualization />
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                Trader Layers
              </th>
              <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                Traders Referred
              </th>
              <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row) => (
              <tr key={row.layer} className="border-b border-gray-50 last:border-0">
                <td className="py-4 font-medium text-black">{row.layer}</td>
                <td className="py-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    {row.tradersReferred}
                  </div>
                </td>
                <td className="py-4 font-medium text-black">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TreeVisualization() {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* YOU - Level 0 */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-medium">YOU</span>
        </div>
      </div>

      {/* Connectors */}
      <div className="flex gap-8">
        <div className="h-6 w-px bg-[#D2FB95]" />
        <div className="h-6 w-px bg-[#D2FB95]" />
      </div>

      {/* L1 */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black"
            >
              <User className="h-4 w-4 text-white" />
            </div>
          ))}
        </div>
        <span className="rounded bg-[#D2FB95] px-2 py-0.5 text-xs font-medium">L1</span>
      </div>

      {/* Connectors */}
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-6 w-px bg-[#D2FB95]" />
        ))}
      </div>

      {/* L2 */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black"
            >
              <User className="h-4 w-4 text-white" />
            </div>
          ))}
        </div>
        <span className="rounded bg-[#D2FB95] px-2 py-0.5 text-xs font-medium">L2</span>
      </div>

      {/* Connectors */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-6 w-px bg-[#D2FB95]" />
        ))}
      </div>

      {/* L3 */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((group) => (
            <div key={group} className="flex gap-0.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500"
                >
                  <User className="h-3 w-3 text-white" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <span className="rounded bg-[#D2FB95] px-2 py-0.5 text-xs font-medium">L3</span>
      </div>
    </div>
  )
}
