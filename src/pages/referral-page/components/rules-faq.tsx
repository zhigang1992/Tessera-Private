import { useMemo } from 'react'
import { marked } from 'marked'

const mockMarkdown = `
## Referral Program Rules

Welcome to our referral program! Here are the rules you need to know:

### How It Works

1. **Share your referral code** with friends and family
2. **Earn rewards** when they sign up and trade
3. **Track your progress** in the dashboard

### Reward Structure

| Level | Commission Rate | Requirements |
|-------|-----------------|--------------|
| L1    | 10%            | Direct referral |
| L2    | 5%             | Referral of referral |
| L3    | 2%             | Third level |

### FAQ

**Q: How do I get my referral code?**

A: Click the "Create new code" button above to generate your unique referral code.

**Q: When will I receive my rewards?**

A: Rewards are distributed weekly every Monday at 00:00 UTC.

**Q: Is there a limit to how many people I can refer?**

A: No, there is no limit! The more you refer, the more you earn.

---

*For more information, please contact our support team.*
`

export function RulesFaq() {
  const htmlContent = useMemo(() => {
    return marked(mockMarkdown) as string
  }, [])

  return (
    <div id="rules-faq" className="rounded-2xl bg-white dark:bg-card p-4 lg:p-6">
      <h2 className="text-lg font-bold text-foreground">Rules & FAQ</h2>

      <div className="my-4 h-px bg-gray-100 dark:bg-border" />

      <div
        className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-table:text-sm dark:prose-invert overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  )
}
