import { ChevronDown, Menu, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import TesseraLogo from './_/terrera-logo.svg?react'
import { Link } from 'react-router'

interface HeaderProps {
  username?: string
  onMenuClick?: () => void
}

export function Header({ username = 'user884792103', onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-4 dark:bg-[#111111] lg:justify-end lg:px-6">
      {/* Mobile: hamburger menu and logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/">
          <TesseraLogo className="h-6 text-[#111111] dark:text-white" />
        </Link>
      </div>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D5F53D]">
              <User className="h-4 w-4 text-black" />
            </div>
            <div className="hidden flex-col items-start sm:flex">
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
