import { HomePage } from './pages/HomePage.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';

export default function App() {
  return (
    <ToastProvider>
      <HomePage />
    </ToastProvider>
  );
}
