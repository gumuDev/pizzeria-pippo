"use client";

import { useEffect, useRef, useCallback } from "react";

export function usePosBroadcast() {
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    broadcastRef.current = new BroadcastChannel("pos-display");
    return () => broadcastRef.current?.close();
  }, []);

  const broadcast = useCallback((type: string, payload?: unknown) => {
    broadcastRef.current?.postMessage({ type, payload });
  }, []);

  return { broadcast };
}
