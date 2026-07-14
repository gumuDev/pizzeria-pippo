"use client";

import { useParams, useRouter } from "next/navigation";
import { Button, Tag, Typography, Space, Row, Col, Skeleton } from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { usePromotionDetail } from "@/features/promotions/hooks/usePromotionDetail";
import { TYPE_OPTIONS, TYPE_COLORS } from "@/features/promotions/constants/promotion.constants";
import { PromotionInfoCard } from "@/features/promotions/components/PromotionInfoCard";
import { PromotionRulesCard } from "@/features/promotions/components/PromotionRulesCard";

const { Title, Text } = Typography;

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
        <Col xs={24} lg={8}>
          <PromotionInfoCard promotion={promotion} typeLabel={typeLabel} typeColor={TYPE_COLORS[promotion.type]} branchName={branchName} />
        </Col>

        <Col xs={24} lg={16}>
          <PromotionRulesCard rules={promotion.promotion_rules} type={promotion.type} variants={variants} />
        </Col>
      </Row>
    </div>
  );
}
