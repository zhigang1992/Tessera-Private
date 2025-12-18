import { useMemo } from 'react'
import { marked } from 'marked'

const mockMarkdown = `
## Trading Rules

Welcome to the trading section! Here are the rules you need to know:

### How Trading Points Work

1. **Earn points** for every trade you make
2. **Volume matters** - higher volume earns more points
3. **Track your progress** in the dashboard

### Point Structure

| Action | Points Rate | Notes |
|--------|-------------|-------|
| Buy    | 1 point per $100 | Standard rate |
| Sell   | 1 point per $100 | Standard rate |
| Referral Bonus | +10% | When using referral code |

### FAQ

**Q: How do I earn trading points?**

A: Simply trade on the platform. Points are automatically calculated based on your trading volume.

**Q: When do points update?**

A: Points are updated in real-time after each completed trade.

**Q: Can I transfer my points?**

A: No, trading points are tied to your account and cannot be transferred.

---

*For more information, please contact our support team.*
`

export function TradersRulesFaq() {
  const htmlContent = useMemo(() => {
    return marked(mockMarkdown) as string
  }, [])

  return (
    <div id="rules-faq" className="rounded-2xl bg-white p-4 lg:p-6">
      <h2 className="text-lg font-bold text-black">Rules & FAQ</h2>

      <div className="my-4 h-px bg-gray-100" />

      <div
        className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-black prose-strong:text-black prose-table:text-sm overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  )
}
