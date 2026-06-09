import { useEffect, useState } from 'react'
import { Background } from './components/Background'
import { Home } from './screens/Home'
import { BreathingSession } from './screens/BreathingSession'
import { TimerSession } from './screens/TimerSession'
import { Grounding } from './screens/Grounding'
import { Pause } from './screens/Pause'
import { Journal } from './screens/Journal'
import { About } from './screens/About'
import { timeOfDay } from './lib/time'
import { useSettings } from './lib/store'
import type { Practice } from './types'

type Route =
  | { name: 'home' }
  | { name: 'session'; practice: Practice }
  | { name: 'journal' }
  | { name: 'about' }

export default function App() {
  const settings = useSettings()
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [time, setTime] = useState(timeOfDay())

  // Keep the background in step with the real time of day.
  useEffect(() => {
    const id = setInterval(() => setTime(timeOfDay()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Reflect the "less motion" preference globally.
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion)
  }, [settings.reduceMotion])

  const home = () => setRoute({ name: 'home' })
  const open = (practice: Practice) => setRoute({ name: 'session', practice })

  function renderSession(practice: Practice) {
    switch (practice.kind) {
      case 'breathing':
        return <BreathingSession practice={practice} onDone={home} />
      case 'timer':
        return <TimerSession practice={practice} onDone={home} />
      case 'grounding':
        return <Grounding practice={practice} onDone={home} />
      case 'pause':
        return <Pause practice={practice} onDone={home} />
    }
  }

  const routeKey =
    route.name === 'session' ? `session-${route.practice.id}` : route.name

  return (
    <>
      <Background time={time} />
      <main key={routeKey} className="relative">
        {route.name === 'home' && (
          <Home
            time={time}
            onOpen={open}
            onJournal={() => setRoute({ name: 'journal' })}
            onAbout={() => setRoute({ name: 'about' })}
          />
        )}
        {route.name === 'session' && renderSession(route.practice)}
        {route.name === 'journal' && <Journal onBack={home} />}
        {route.name === 'about' && <About onBack={home} />}
      </main>
    </>
  )
}
