import { useEffect, useState } from 'react'
import { GreetService } from '../bindings/changeme/backend'

function App() {
  const [name, setName] = useState('')
  const [greeting, setGreeting] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Listen for time events from Go backend
    if (window.runtime?.Events) {
      window.runtime.Events.On('time', (data: any) => {
        setTime(data.data)
      })
    }
  }, [])

  const handleGreet = async () => {
    if (!name.trim()) return

    setLoading(true)
    try {
      const result = await GreetService.Greet(name)
      setGreeting(result)
    } catch (error) {
      console.error('Error greeting:', error)
      setGreeting('Error: Could not greet')
    } finally {
      setLoading(false)
    }
  }

  const handleHideToTray = async () => {
    try {
      await window.runtime.Window.Hide()
    } catch (error) {
      console.error('Error hiding to tray:', error)
    }
  }

  const handleQuitApp = async () => {
    try {
      await GreetService.QuitApp()
    } catch (error) {
      console.error('Error quitting app:', error)
      alert('Could not quit app. Please use the system tray menu.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Wails Helper App
          </h1>
          <p className="text-slate-300 text-lg">
            System tray application with React + Tailwind CSS
          </p>
        </header>

        {/* Main Card */}
        <main className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-8">
            {/* Greeting Section */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">Greeting Service</h2>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && handleGreet()}
                  />
                </div>

                <button
                  onClick={handleGreet}
                  disabled={loading || !name.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Greeting...' : 'Greet'}
                </button>

                {greeting && (
                  <div className="mt-4 p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                    <p className="text-center text-lg">{greeting}</p>
                  </div>
                )}
              </div>
            </section>

            {/* System Tray Controls */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">System Tray Controls</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleHideToTray}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all"
                >
                  Hide to Tray
                </button>

                <button
                  onClick={handleQuitApp}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all"
                >
                  Quit App
                </button>
              </div>
            </section>

            {/* Time Display */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-center">Live Time</h2>
              <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                <p className="text-center text-lg font-mono">
                  {time || 'Waiting for time events...'}
                </p>
              </div>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-slate-400">
          <p>Right-click the system tray icon for more options</p>
          <p className="mt-2 text-sm">
            Built with Wails v3 • React • TypeScript • Tailwind CSS v4
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
