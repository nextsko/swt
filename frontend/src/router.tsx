import { createHashRouter, Navigate } from 'react-router-dom'
import {
    AppShell,
    DetailScaffold,
} from './components/layout/AppShell'
import { BotDetailPage } from './pages/bots/BotDetailPage'
import { BotMarketPage } from './pages/bots/BotMarketPage'
import { ContactDetailPage } from './pages/contacts/ContactDetailPage'
import { ContactListPage } from './pages/contacts/ContactListPage'
import { ChatDetailPage } from './pages/conversations/ChatDetailPage'
import { ConversationListPage } from './pages/conversations/ConversationListPage'
import { CreateGroupPage } from './pages/conversations/CreateGroupPage'
import { GroupMembersPage } from './pages/conversations/GroupMembersPage'
import { DiscoverPage } from './pages/discover/DiscoverPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { GlobalSearchPage } from './pages/search/GlobalSearchPage'

export const router = createHashRouter([
    {
        path: '/',
        element: <AppShell />,
        children: [
            { index: true, element: <Navigate to="/messages" replace /> },
            { path: 'messages', element: <ConversationListPage /> },
            { path: 'contacts', element: <ContactListPage /> },
            { path: 'discover', element: <DiscoverPage /> },
            { path: 'profile', element: <ProfilePage /> },
            // desktop: chat renders in right pane
            { path: 'chat/:id', element: <ChatDetailPage /> },
        ],
    },
    // mobile: detail pages full-screen overlay
    {
        path: '/chat',
        element: <DetailScaffold />,
        children: [{ path: ':id', element: <ChatDetailPage /> }],
    },
    {
        path: '/bots',
        element: <DetailScaffold />,
        children: [
            { index: true, element: <BotMarketPage /> },
            { path: ':id', element: <BotDetailPage /> },
        ],
    },
    {
        path: '/contacts',
        element: <DetailScaffold />,
        children: [
            { index: true, element: <ContactListPage /> },
            { path: ':id', element: <ContactDetailPage /> },
        ],
    },
    {
        path: '/new-group',
        element: <DetailScaffold />,
        children: [{ index: true, element: <CreateGroupPage /> }],
    },
    {
        path: '/search',
        element: <DetailScaffold />,
        children: [{ index: true, element: <GlobalSearchPage /> }],
    },
    {
        path: '/group/:id/members',
        element: <DetailScaffold />,
        children: [{ index: true, element: <GroupMembersPage /> }],
    },
])
