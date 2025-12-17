interface PlaceholderPageProps {
  title: string
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-2xl bg-white dark:bg-[#111111]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-black dark:text-white">{title}</h1>
        <p className="mt-2 text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}
