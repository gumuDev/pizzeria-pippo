import { Grid } from "antd";

export function useIsMobile(): boolean {
  const screens = Grid.useBreakpoint();
  return screens.md === false;
}
