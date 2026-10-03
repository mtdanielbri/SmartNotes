import { Logo } from '../Logo'
import { AppMenu } from './AppMenu'
import { BoardSwitcher } from './BoardSwitcher'
import { FilterMenu } from './FilterMenu'
import { InstallButton } from './InstallButton'
import { SearchBox } from './SearchBox'
import { SortSelect } from './SortSelect'
import { ThemeToggle } from './ThemeToggle'
import './TopBar.css'

export function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <Logo />
        <span className="topbar__title">SmartNotes</span>
      </div>
      <div className="topbar__board">
        <BoardSwitcher />
      </div>
      <div className="topbar__tools">
        <SearchBox />
        <FilterMenu />
        <SortSelect />
      </div>
      <div className="topbar__actions">
        <InstallButton />
        <ThemeToggle />
        <AppMenu />
      </div>
    </header>
  )
}
