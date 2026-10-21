import React from 'react'
import { observer } from 'mobx-react-lite'
import { MainContextProvider, useMainContext } from './hooks/useMainContext'
import { Viewer3D } from './components/Viewer3D/Viewer3D'
import { Header } from './components/UI/Header'
import { Sidebar } from './components/UI/Sidebar'
import { FloatingTitle } from './components/UI/FloatingTitle'
import { ModelTester } from './components/ModelTester/ModelTester'
import { useRouter } from './router/useRouter'
import './App.css'

const MainViewerArea: React.FC = observer(() => {
  const { configuratorStore } = useMainContext()
  const isComplete = configuratorStore.isConfigurationComplete

  return (
    <main className="main-area bg-gradient">
      <FloatingTitle />
      {!isComplete && (
        <div className="selection-prompt-overlay">
          <div className="prompt-card">
            <div className="prompt-icon-badge">⚙️</div>
            <h3 className="prompt-title">Select Hose Configuration</h3>
            <p className="prompt-desc">
              Please choose a <strong>Category</strong>, <strong>Braid Type</strong>, and <strong>Size</strong> from the sidebar to render the 3D pipe model.
            </p>
          </div>
        </div>
      )}
      <Viewer3D />
    </main>
  )
})

function App() {
  const { isTestRoute } = useRouter()

  return (
    <MainContextProvider>
      <div className="app-container">
        <Header />
        <div className="body-container">
          {isTestRoute ? (
            <ModelTester />
          ) : (
            <>
              <Sidebar />
              <MainViewerArea />
            </>
          )}
        </div>
      </div>
    </MainContextProvider>
  )
}

export default App
