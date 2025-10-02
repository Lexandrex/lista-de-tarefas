import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import RequireAuth from "@/lib/RequireAuth";
import AdminRoute from "@/lib/AdminRoute";
import Login from "@/features/auth/Login";
import RequestReset from "@/features/auth/RequestReset";
import ResetPassword from "@/features/auth/ResetPassword";
import TeamsPage from "@/features/teams/Teams";
import ProjectsPage from "@/features/projects/Projects";
import TasksPage from "@/features/tasks/Tasks";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/reset", element: <RequestReset /> },
  { path: "/reset/:token", element: <ResetPassword /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <ProjectsPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "tasks", element: <TasksPage /> },
          {
            path: "teams",
            element: (
              <AdminRoute>
                <TeamsPage />
              </AdminRoute>
            ),
          }
          // {
          //   path: "admin",
          //   element: <AdminRoute><AdminDashboard /></AdminRoute>
          // }
        ],
      },
    ],
  },
  { path: "*", element: <div>Not found</div> },
]);
