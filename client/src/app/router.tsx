import { createBrowserRouter } from "react-router-dom";
import RequireAuth from "@/lib/RequireAuth";
import Layout from "./Layout";
import Login from "@/features/auth/Login";
import ProjectsPage from "@/features/projects/Projects";
import TasksPage from "@/features/tasks/Tasks";
import TeamsPage from "@/features/teams/Teams";
import AdminRoute from "@/lib/AdminRoute";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
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
      },
    ],
  },
  { path: "*", element: <div>Not found</div> },
]);
