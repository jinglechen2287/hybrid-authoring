import EnterXRButtons from '~/components/overlays/EnterXRButtons'
import Canvas from '~/canvas/Canvas'
import { useEffect } from 'react'
import { startSceneSupabaseSync } from '~/util'

export default function App() {
  useEffect(() => {
    const stop = startSceneSupabaseSync(1)
    return () => {
      stop?.()
    }
  }, [])
  return (
    <>
      <EnterXRButtons />
      <Canvas />
    </>
  )
}

