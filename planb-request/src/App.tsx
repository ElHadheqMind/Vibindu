import { ThemeProvider } from 'styled-components'
import { GlobalStyles, theme } from './styles/theme'
import RequestPage from './components/RequestPage'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <RequestPage />
    </ThemeProvider>
  )
}

export default App

