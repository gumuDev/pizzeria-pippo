import { Spin } from "antd";

// Next.js shows this instantly on every admin navigation, while the
// destination page's code loads — before that page even mounts, let alone
// fetches its own data. Without it there's a visible gap with zero feedback
// between clicking a menu item and anything appearing on screen.
export default function AdminLoading() {
  return (
    <div style={{ height: "100%", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" />
    </div>
  );
}
