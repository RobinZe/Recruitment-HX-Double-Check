import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import JobDetail from '../pages/JobDetail';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/job/:id',
    element: <JobDetail />,
  },
]);

export default router;