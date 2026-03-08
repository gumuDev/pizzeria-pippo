"use client";

import { useState, useEffect, useCallback } from "react";
import { Form, notification } from "antd";
import { supabase } from "@/lib/supabase";
import { PromotionsService } from "../services/promotions.service";
import type { Promotion, Branch, Variant, Rule } from "../types/promotion.types";
import dayjs from "dayjs";

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [promoType, setPromoType] = useState<string>("");
  const [rules, setRules] = useState<Rule[]>([]);
  const [form] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [promos, { data: b }, v] = await Promise.all([
      PromotionsService.getPromotions(showInactive),
      supabase.from("branches").select("*").order("name"),
      PromotionsService.getVariants(),
    ]);
    setPromotions(promos);
    if (b) setBranches(b);
    setVariants(v);
    setLoading(false);
  }, [showInactive]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => {
    setEditing(null);
    setPromoType("");
    setRules([]);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: Promotion) => {
    setEditing(record);
    setPromoType(record.type);
    setRules(record.promotion_rules ?? []);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      days_of_week: record.days_of_week,
      dates: [dayjs(record.start_date), dayjs(record.end_date)],
      branch_id: record.branch_id ?? "all",
      active: record.active,
    });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      name: values.name,
      type: values.type,
      days_of_week: values.days_of_week ?? [],
      start_date: values.dates[0].format("YYYY-MM-DD"),
      end_date: values.dates[1].format("YYYY-MM-DD"),
      branch_id: values.branch_id === "all" ? null : values.branch_id,
      active: values.active ?? true,
      rules,
    };
    const ok = editing
      ? await PromotionsService.updatePromotion(editing.id, payload)
      : await PromotionsService.createPromotion(payload);
    if (ok) { setModalOpen(false); fetchAll(); }
  };

  const handleToggleIsActive = async (promo: Promotion) => {
    const ok = await PromotionsService.patchPromotion(promo.id, { is_active: !promo.is_active });
    if (ok) {
      fetchAll();
      notification.success({ message: promo.is_active ? "Promoción desactivada" : "Promoción reactivada" });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await PromotionsService.patchPromotion(id, { active });
    fetchAll();
  };

  const addRule = () => {
    setRules((prev) => [...prev, { variant_id: null, buy_qty: null, get_qty: null, discount_percent: null, combo_price: null }]);
  };

  const updateRule = (index: number, field: keyof Rule, value: unknown) => {
    setRules((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTypeChange = (type: string) => {
    setPromoType(type);
    setRules([]);
  };

  return {
    promotions, branches, variants, loading,
    modalOpen, editing, showInactive, setShowInactive,
    promoType, setPromoType,
    rules,
    form,
    openCreate, openEdit, closeModal,
    handleSave, handleToggleIsActive, handleToggleActive,
    handleTypeChange,
    addRule, updateRule, removeRule,
  };
}
