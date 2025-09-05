import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Home page (index route)
  index("routes/Home.tsx"),

  // Auth pages
  route("login", "routes/Login.tsx"),
  route("register", "routes/Register.tsx"),

  // Main pages
  route("leaderboard", "routes/Leaderboard.tsx"),
  route("submit", "routes/Submit.tsx"),
  route("token", "routes/TokenCounter.tsx"),
  
  // Admin pages
  route("admin", "routes/Admin.tsx"),
] satisfies RouteConfig;
