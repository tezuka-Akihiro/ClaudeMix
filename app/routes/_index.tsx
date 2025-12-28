import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "ClaudeMix" },
    { name: "description", content: "Welcome to ClaudeMix!" },
  ];
};

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to ClaudeMix</h1>
      <div style={{ marginTop: "2rem" }}>
        <h2>Available Features</h2>
        <ul>
          <li>
            <Link to="/blog" style={{ color: "#1976d2", textDecoration: "underline" }}>
              blog
            </Link>
          </li>
        </ul>
      </div>
      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <h2>E2E Test Paths (Manual Verification)</h2>
        <div style={{ marginTop: "1rem" }}>
          <h3>Authentication</h3>
          <ul>
            <li>
              <Link to="/register" style={{ color: "#1976d2", textDecoration: "underline" }}>
                /register - User Registration
              </Link>
            </li>
            <li>
              <Link to="/login" style={{ color: "#1976d2", textDecoration: "underline" }}>
                /login - User Login
              </Link>
            </li>
            <li>
              <Link to="/login?message=session-expired" style={{ color: "#1976d2", textDecoration: "underline" }}>
                /login?message=session-expired - Flash Message Test
              </Link>
            </li>
            <li>
              <Link to="/logout" style={{ color: "#1976d2", textDecoration: "underline" }}>
                /logout - User Logout
              </Link>
            </li>
          </ul>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <h3>Account Section (Requires Authentication)</h3>
          <ul>
            <li>
              <Link to="/account" style={{ color: "#1976d2", textDecoration: "underline" }}>
                /account - Account Home (マイページ)
              </Link>
            </li>
            <li>
              <Link to="/account/settings" style={{ color: "#1976d2", textDecoration: "underline" }}>
                /account/settings - Settings (設定) - Modal Test
              </Link>
            </li>
            <li>
              <Link to="/account/subscription" style={{ color: "#1976d2", textDecoration: "underline" }}>
                /account/subscription - Subscription (サブスクリプション)
              </Link>
            </li>
          </ul>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <h3>Test Instructions</h3>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            <li>✅ Register a new user first</li>
            <li>✅ Test navigation between account pages</li>
            <li>✅ Click "設定" link from /account to /account/settings</li>
            <li>✅ Test modal opening (email change button)</li>
            <li>✅ Test flash message display</li>
          </ul>
        </div>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <h2>Resources</h2>
        <ul>
          <li>
            <a
              target="_blank"
              href="https://remix.run/tutorials/blog"
              rel="noreferrer"
              style={{ color: "#1976d2", textDecoration: "underline" }}
            >
              15m Quickstart Blog Tutorial
            </a>
          </li>
          <li>
            <a
              target="_blank"
              href="https://remix.run/tutorials/jokes"
              rel="noreferrer"
              style={{ color: "#1976d2", textDecoration: "underline" }}
            >
              Deep Dive Jokes App Tutorial
            </a>
          </li>
          <li>
            <a
              target="_blank"
              href="https://remix.run/docs"
              rel="noreferrer"
              style={{ color: "#1976d2", textDecoration: "underline" }}
            >
              Remix Docs
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}