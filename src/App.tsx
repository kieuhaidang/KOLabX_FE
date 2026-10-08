import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './components/auth/AuthProvider';
import { ThemeProvider } from './theme/ThemeProvider';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
