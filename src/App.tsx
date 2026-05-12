/**
 * 앱 진입점 컴포넌트 — Router만 마운트.
 *
 * 글로벌 CSS는 main.tsx에서 import. 본 컴포넌트는 router 주입만 담당.
 */
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
