import { RouterProvider } from 'react-router-dom'
import { DeviceFrame } from './components/layout/DeviceFrame'
import { router } from './router'

function App() {
    return (
        <DeviceFrame>
            <RouterProvider router={router} />
        </DeviceFrame>
    )
}

export default App
