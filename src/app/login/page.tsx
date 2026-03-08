"use client";

import { useState } from "react";
import { Form, Input, Button, Card, Alert, Typography } from "antd";
import { signIn, getUserProfile } from "@/lib/auth";

const { Title } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      await signIn(values.email, values.password);
      const profile = await getUserProfile();
      const role = profile?.role;

      if (role === "admin") {
        window.location.href = "/dashboard";
      } else if (role === "cocinero") {
        window.location.href = "/kitchen";
      } else {
        window.location.href = "/pos";
      }
    } catch {
      setError("Credenciales incorrectas. Verificá tu email y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm shadow-md">
        <div className="text-center mb-6">
          <Title level={3} className="!mb-1">Pizzería Pippo</Title>
          <p className="text-gray-500 text-sm">Ingresá con tu cuenta</p>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        <Form
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
        >
          <Form.Item
            label="Correo electrónico"
            name="email"
            rules={[{ required: true, message: "Ingresá tu email" }, { type: "email", message: "Email inválido" }]}
          >
            <Input placeholder="admin@pizzeria.com" size="large" />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: "Ingresá tu contraseña" }]}
          >
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Iniciar sesión
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
