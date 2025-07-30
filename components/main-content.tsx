"use client"

import { useNavigation } from "@/contexts/navigation-context"
import { Home } from "./home"
import { SearchPage } from "./search"
import { InboxPage } from "./inbox"
import { CalendarPage } from "./calendar"
import { TemplatesPage } from "./templates"
import { TrashPage } from "./trash"
import { HelpPage } from "./help"
import { Chat } from "./chart"

export function MainContent() {
  const { activeItem } = useNavigation()

  switch (activeItem) {
    case 'home':
      return <Home />
    case 'search':
      return <SearchPage />
    case 'ask-ai':
      return <Chat />
    case 'inbox':
      return <InboxPage />
    case 'calendar':
      return <CalendarPage />
    case 'templates':
      return <TemplatesPage />
    case 'trash':
      return <TrashPage />
    case 'help':
      return <HelpPage />
    default:
      return <Home />
  }
} 