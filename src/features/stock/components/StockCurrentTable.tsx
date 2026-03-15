"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Table, Tag, Space, Typography, Tooltip, Spin } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { useIsMobile } from "@/lib/useIsMobile";
import type { StockRow } from "../types/stock.types";

const { Text } = Typography;

interface Props {
  stock: StockRow[];
  loading: boolean;
  onEditMinQty: (record: StockRow) => void;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function StockCurrentTable({ stock, loading, onEditMinQty, page, total, pageSize, onPageChange }: Props) {
  const isMobile = useIsMobile();
  const [mobileRows, setMobileRows] = useState<StockRow[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = mobileRows.length < total;

  // Acumula rows en móvil
  useEffect(() => {
    if (!isMobile) return;
    if (page === 1) {
      setMobileRows(stock);
    } else {
      setMobileRows((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        return [...prev, ...stock.filter((r) => !existingIds.has(r.id))];
      });
    }
    setLoadingMore(false);
  }, [stock, page, isMobile]);

  // Resetea cards al cambiar sucursal (page vuelve a 1 desde el hook)
  useEffect(() => {
    if (isMobile && page === 1) setMobileRows(stock);
  }, [page, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  // IntersectionObserver para infinite scroll
  const handleSentinel = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node;
  }, []);

  useEffect(() => {
    if (!isMobile || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setLoadingMore(true);
          onPageChange(page + 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isMobile, hasMore, loading, loadingMore, onPageChange, page]);

  const columns = [
    {
      title: "Insumo",
      key: "ingredient",
      render: (_: unknown, r: StockRow) => (
        <Space>
          {r.quantity < r.min_quantity && (
            <Tooltip title="Stock bajo el mínimo"><WarningOutlined style={{ color: "#ef4444" }} /></Tooltip>
          )}
          <Text>{r.ingredients?.name}</Text>
        </Space>
      ),
    },
    {
      title: "Unidad",
      key: "unit",
      render: (_: unknown, r: StockRow) => <Tag>{r.ingredients?.unit}</Tag>,
    },
    {
      title: "Stock actual",
      dataIndex: "quantity",
      key: "quantity",
      render: (qty: number, r: StockRow) => (
        <Text strong style={{ color: qty < r.min_quantity ? "#ef4444" : "#16a34a" }}>{qty}</Text>
      ),
    },
    {
      title: "Mínimo",
      dataIndex: "min_quantity",
      key: "min_quantity",
      render: (min: number, r: StockRow) => (
        <button
          type="button"
          style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0 }}
          onClick={() => onEditMinQty(r)}
        >
          {min}
        </button>
      ),
    },
    {
      title: "Estado",
      key: "status",
      render: (_: unknown, r: StockRow) =>
        r.quantity < r.min_quantity
          ? <Tag color="red">Stock bajo</Tag>
          : <Tag color="green">OK</Tag>,
    },
  ];

  if (isMobile) {
    if (loading && page === 1) return <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Cargando...</div>;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mobileRows.map((r) => {
          const isLow = r.quantity < r.min_quantity;
          return (
            <div
              key={r.id}
              style={{
                background: isLow ? "#fef2f2" : "#fff",
                border: `1px solid ${isLow ? "#fca5a5" : "#e5e7eb"}`,
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {isLow && <WarningOutlined style={{ color: "#ef4444" }} />}
                  <Text strong style={{ fontSize: 15 }}>{r.ingredients?.name}</Text>
                </div>
                {isLow ? <Tag color="red" style={{ margin: 0 }}>Stock bajo</Tag> : <Tag color="green" style={{ margin: 0 }}>OK</Tag>}
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <Tag style={{ margin: 0 }}>{r.ingredients?.unit}</Tag>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Actual: </Text>
                  <Text strong style={{ color: isLow ? "#ef4444" : "#16a34a" }}>{r.quantity}</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Mínimo: </Text>
                  <button
                    type="button"
                    style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0, fontWeight: 600 }}
                    onClick={() => onEditMinQty(r)}
                  >
                    {r.min_quantity}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={handleSentinel} style={{ height: 1 }} />

        {loadingMore && (
          <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
            <Spin size="small" />
          </div>
        )}

        {!hasMore && mobileRows.length > 0 && (
          <Text type="secondary" style={{ textAlign: "center", display: "block", padding: "8px 0", fontSize: 12 }}>
            {mobileRows.length} insumos en total
          </Text>
        )}
      </div>
    );
  }

  return (
    <Table
      dataSource={stock}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        showTotal: (t) => `${t} insumos`,
        onChange: onPageChange,
        showSizeChanger: false,
      }}
      rowClassName={(r: StockRow) => r.quantity < r.min_quantity ? "bg-red-50" : ""}
    />
  );
}
