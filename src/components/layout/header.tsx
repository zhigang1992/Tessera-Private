import { ChevronDown, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  username?: string
}

export function Header({ username = 'user884792103' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end border-b border-border bg-white px-6 dark:bg-[#111111]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D5F53D]">
              <User className="h-4 w-4 text-black" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">My account</span>
              <span className="text-sm font-medium">{username}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
