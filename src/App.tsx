import { Route, Routes } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'
import { Layout } from './components/Layout'
import { MetaManager } from './components/MetaManager'
import { ScrollToTop } from './components/ScrollToTop'
import { Home } from './pages/Home'

const AdminRoutes = lazy(() => import('./admin/AdminRoutes'))
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })))
const Contact = lazy(() => import('./pages/Contact').then((module) => ({ default: module.Contact })))
const HowItWorks = lazy(() => import('./pages/HowItWorks').then((module) => ({ default: module.HowItWorks })))
const LegalIndex = lazy(() => import('./pages/LegalIndex').then((module) => ({ default: module.LegalIndex })))
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })))
const Opportunities = lazy(() => import('./pages/Opportunities').then((module) => ({ default: module.Opportunities })))
const Privacy = lazy(() => import('./pages/Privacy').then((module) => ({ default: module.Privacy })))
const Services = lazy(() => import('./pages/Services').then((module) => ({ default: module.Services })))
const Terms = lazy(() => import('./pages/Terms').then((module) => ({ default: module.Terms })))

function PublicPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="px-5 py-16 text-sm text-slate-600">Cargando...</div>}>{children}</Suspense>
}

function App() {
  return (
    <>
      <MetaManager />
      <ScrollToTop />
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#faf8f2] p-6 text-sm text-slate-600">Cargando panel...</div>}>
              <AdminRoutes />
            </Suspense>
          }
        />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="nosotros" element={<PublicPage><About /></PublicPage>} />
          <Route path="servicios" element={<PublicPage><Services /></PublicPage>} />
          <Route path="como-funciona" element={<PublicPage><HowItWorks /></PublicPage>} />
          <Route path="oportunidades" element={<PublicPage><Opportunities /></PublicPage>} />
          <Route path="contacto" element={<PublicPage><Contact /></PublicPage>} />
          <Route path="privacidad" element={<PublicPage><Privacy /></PublicPage>} />
          <Route path="terminos" element={<PublicPage><Terms /></PublicPage>} />
          <Route path="terminos-y-privacidad" element={<PublicPage><LegalIndex /></PublicPage>} />
          <Route path="*" element={<PublicPage><NotFound /></PublicPage>} />
        </Route>
      </Routes>
    </>
  )
}

export default App
