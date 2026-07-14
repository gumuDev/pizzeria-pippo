import { AntdRegistry } from "@ant-design/nextjs-registry";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      {children}
    </AntdRegistry>
  );
}
