import { createBrowserRouter } from "react-router-dom";
import RequireAuth from "@/lib/RequireAuth";
import Layout from "./Layout";
import Login from "@/features/auth/Login";
import RequestReset from "@/features/auth/RequestReset";
import ResetPassword from "@/features/auth/ResetPassword";
import ProjectsPage from "@/features/projects/Projects";
import UsersPage from "@/features/users/Users";
import TasksPage from "@/features/tasks/Tasks";
import TeamsPage from "@/features/teams/Teams";
import AdminRoute from "@/lib/AdminRoute";
import HomePage from "@/features/home/Home";
import ProjectDetailsPage from "@/features/projects/ProjectDetails";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/reset", element: <RequestReset /> },
  { path: "/reset-password", element: <ResetPassword /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
  { index: true, element: <HomePage /> },
      { path: "projects/:id", element: <ProjectDetailsPage /> },
      { path: "projects", element: <ProjectsPage /> },
  { path: "users", element: <UsersPage /> },
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
