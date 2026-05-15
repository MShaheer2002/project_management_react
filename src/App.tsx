import { AppProvider } from './AppContext';
import { AppRoutes } from '@/app/routes';

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
