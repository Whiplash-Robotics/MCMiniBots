import {
    type RouteConfig,
    index,
    route,
} from "@react-router/dev/routes";

export default [
    // Home page (index route)
    index("routes/Home.tsx"),

    // Other pages
    route("login", "routes/Login.tsx"),
    route("admin", "routes/Admin.tsx"),
    route("submit", "routes/Submit.tsx"),
    route("tokens", "routes/TokenCounter.tsx"),
] satisfies RouteConfig;
