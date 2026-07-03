"use client";

import { useParams, useRouter } from "next/navigation";
import { Button, Tag, Typography, Space, Card, Row, Col, Skeleton, Badge, Divider } from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { usePromotionDetail } from "@/features/promotions/hooks/usePromotionDetail";
import { TYPE_OPTIONS, TYPE_COLORS, DAYS } from "@/features/promotions/constants/promotion.constants";
import type { Rule } from "@/features/promotions/types/promotion.types";

const { Title, Text } = Typography;

const CATEGORY_LABELS: Record<string, string> = { pizza: "Pizza", bebida: "Bebida", otro: "Otro" };

export default function PromotionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { promotion, branches, variants, loading } = usePromotionDetail(id);

  if (loading) return <div style={{ padding: 24 }}><Skeleton active paragraph={{ rows: 6 }} /></div>;
  if (!promotion) return <div style={{ padding: 24 }}><Text type="danger">Promoción no encontrada.</Text></div>;

  const branchName = promotion.branch_id
    ? (branches.find((b) => b.id === promotion.branch_id)?.name ?? promotion.branch_id)
    : null;
  const typeLabel = TYPE_OPTIONS.find((o) => o.value === promotion.type)?.label ?? promotion.type;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/promotions")}>Volver</Button>
          <Title level={4} style={{ margin: 0 }}>{promotion.name}</Title>
          {!promotion.is_active && <Tag color="default">Inactiva</Tag>}
        </Space>
        <Button icon={<EditOutlined />} type="primary" onClick={() => router.push("/promotions")}>
          Editar
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {/* Left: general info */}
        <Col xs={24} lg={8}>
          <Card>
            <Space wrap style={{ marginBottom: 16 }}>
              <Tag color={TYPE_COLORS[promotion.type]}>{typeLabel}</Tag>
              {promotion.active
                ? <Badge status="success" text="Activa en POS" />
                : <Badge status="default" text="Pausada en POS" />}
            </Space>

            <Divider style={{ margin: "12px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Sucursal</Text>
                {branchName ? <Tag>{branchName}</Tag> : <Tag color="purple">Todas las sucursales</Tag>}
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Vigencia</Text>
                <Text>{promotion.start_date} → {promotion.end_date}</Text>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Días activos</Text>
                <Space size={4} wrap>
                  {DAYS.map((d) => (
                    <Tag key={d.value} color={promotion.days_of_week.includes(d.value) ? "blue" : "default"}>
                      {d.label}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          </Card>
        </Col>

        {/* Right: rules */}
        <Col xs={24} lg={16}>
          <Card title={<Text strong>Reglas</Text>}>
            {(!promotion.promotion_rules || promotion.promotion_rules.length === 0) && (
              <Text type="secondary" style={{ fontStyle: "italic" }}>Sin reglas configuradas</Text>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {promotion.promotion_rules?.map((rule, i) => (
                <RuleCard
                  key={i}
                  index={i}
                  rule={rule}
                  type={promotion.type}
                  variants={variants}
                />
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function RuleCard({ index, rule, type, variants }: {
  index: number;
  rule: Rule;
  type: string;
  variants: { id: string; name: string; product_name: string }[];
}) {
  const variant = rule.variant_id ? variants.find((v) => v.id === rule.variant_id) : null;
  const variantLabel = variant ? `${variant.product_name} — ${variant.name}` : null;
  const isFlexible = !rule.variant_id && (rule.category || rule.variant_size);

  return (
    <div style={{ padding: "12px 16px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
      <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
        {type === "COMBO" ? `Slot ${index + 1}` : `Regla ${index + 1}`}
      </Text>

      {type === "BUY_X_GET_Y" && (
        <Space wrap>
          <Text style={{ fontSize: 14 }}>
            Comprá <Text strong>{rule.buy_qty}</Text> llevate <Text strong>{rule.get_qty}</Text> gratis
          </Text>
          {variantLabel && <Tag>{variantLabel}</Tag>}
        </Space>
      )}

      {type === "PERCENTAGE" && (
        <Space wrap>
          <Tag color="blue" style={{ fontSize: 14 }}>{rule.discount_percent}% off</Tag>
          {variantLabel
            ? <Text>{variantLabel}</Text>
            : <Text type="secondary">Todos los productos</Text>}
        </Space>
      )}

      {type === "COMBO" && (
        <Space wrap>
          {isFlexible ? (
            <>
              {rule.category && <Tag>{CATEGORY_LABELS[rule.category] ?? rule.category}</Tag>}
              {rule.variant_size && <Tag>{rule.variant_size}</Tag>}
            </>
          ) : (
            variantLabel ? <Text>{variantLabel}</Text> : <Text type="secondary">—</Text>
          )}
          {index === 0 && rule.combo_price != null && (
            <Tag color="green">Precio combo: Bs {Number(rule.combo_price).toFixed(2)}</Tag>
          )}
        </Space>
      )}
    </div>
  );
}
