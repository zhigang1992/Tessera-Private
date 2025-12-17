export function RewardsOverview() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Rewards Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#D2FB95] to-[#E8FFC7] p-6">
        <div className="relative z-10">
          <p className="text-sm text-black/60">Rewards</p>
          <p className="text-4xl font-bold text-black">$100</p>
        </div>
        {/* Money Stack Illustration */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <MoneyStackIcon />
        </div>
      </div>

      {/* Referral Points Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-muted-foreground">Referral Points</p>
        <p className="mt-2 text-2xl font-bold text-black">—</p>
      </div>
    </div>
  )
}

function MoneyStackIcon() {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-80"
    >
      <ellipse cx="60" cy="85" rx="50" ry="10" fill="#4ADE80" fillOpacity="0.3" />
      <rect x="20" y="20" width="80" height="50" rx="4" fill="#22C55E" />
      <rect x="25" y="25" width="70" height="40" rx="2" fill="#16A34A" />
      <circle cx="60" cy="45" r="15" fill="#15803D" />
      <text x="60" y="50" textAnchor="middle" fill="#22C55E" fontSize="14" fontWeight="bold">
        $
      </text>
      <rect x="15" y="30" width="80" height="50" rx="4" fill="#22C55E" />
      <rect x="20" y="35" width="70" height="40" rx="2" fill="#16A34A" />
      <circle cx="55" cy="55" r="15" fill="#15803D" />
      <text x="55" y="60" textAnchor="middle" fill="#22C55E" fontSize="14" fontWeight="bold">
        $
      </text>
      <rect x="10" y="40" width="80" height="50" rx="4" fill="#22C55E" />
      <rect x="15" y="45" width="70" height="40" rx="2" fill="#16A34A" />
      <circle cx="50" cy="65" r="15" fill="#15803D" />
      <text x="50" y="70" textAnchor="middle" fill="#22C55E" fontSize="14" fontWeight="bold">
        $
      </text>
    </svg>
  )
}
