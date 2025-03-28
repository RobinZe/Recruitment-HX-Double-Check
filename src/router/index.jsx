import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import JobDetail from '../pages/JobDetail';
import Debug from '../pages/Debug';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/job/:id',
    element: <JobDetail />,
  },
  {
    path: '/debug',
    element: <Debug />,
  },
]);

export default router;