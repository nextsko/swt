import { createHashRouter, Navigate } from 'react-router-dom'
import {
    DetailScaffold,
    MobileScaffold,
} from './components/layout/MobileScaffold'
import { BotMarketPage } from './pages/bots/BotMarketPage'
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
        element: <MobileScaffold />,
        children: [
            { index: true, element: <Navigate to="/messages" replace /> },
            { path: 'messages', element: <ConversationListPage /> },
            { path: 'contacts', element: <ContactListPage /> },
            { path: 'discover', element: <DiscoverPage /> },
            { path: 'profile', element: <ProfilePage /> },
        ],
    },
    {
        path: '/chat',
        element: <DetailScaffold />,
        children: [{ path: ':id', element: <ChatDetailPage /> }],
    },
    {
        path: '/bots',
        element: <DetailScaffold />,
        children: [{ index: true, element: <BotMarketPage /> }],
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
