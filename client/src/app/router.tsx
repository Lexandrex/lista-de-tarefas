import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from '@/lib/rls';
import { LoginPage } from '@/features/users/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TeamsPage } from '@/features/teams/TeamsPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { CalendarPage } from '@/features/calendar/CalendarPage';
import { AppLayout } from '@/components/AppLayout';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'teams', element: <TeamsPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'tasks', element: <TasksPage /> },
          { path: 'calendar', element: <CalendarPage /> },
        ],
      },
    ],
  },
]);
