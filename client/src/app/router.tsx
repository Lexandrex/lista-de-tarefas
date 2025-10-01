import { createBrowserRouter } from "react-router-dom";
import RequireAuth from "@/lib/RequireAuth";
import Layout from "@/app/Layout";
import App from "@/App";
import Login from "@/features/auth/Login";
import RequestReset from "@/features/auth/RequestReset";
import ResetPassword from "@/features/auth/ResetPassword";
import Teams from "@/features/teams/Teams";
import Projects from "@/features/projects/Projects";
import Tasks from "@/features/tasks/Tasks";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/reset", element: <RequestReset /> },
  { path: "/auth/reset", element: <ResetPassword /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <App /> },
          { path: "teams", element: <Teams /> },
          { path: "projects", element: <Projects /> },
          { path: "tasks", element: <Tasks /> },
        ],
      },
    ],
  },
]);
