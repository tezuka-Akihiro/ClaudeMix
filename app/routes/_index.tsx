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
      <div style={{ marginTop: "2rem" }}>
      </div>
    </div>
  );
}