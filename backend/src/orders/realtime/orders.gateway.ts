import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '../../auth/auth.service';

// Replaces supabase.channel() for kitchen/POS live updates (Fase 4). Clients
// join a room per branch on connect; OrdersService emits into that room
// after a mutation succeeds instead of relying on Postgres replication.
@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' } })
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(OrdersGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const user = await this.authService.resolveUserFromToken(token);
      const branchId = (client.handshake.query.branchId as string | undefined) ?? user.branch_id ?? undefined;
      if (!branchId) {
        client.disconnect();
        return;
      }
      await client.join(this.branchRoom(branchId));
    } catch (err) {
      this.logger.warn(`Conexión WS rechazada: ${(err as Error).message}`);
      client.disconnect();
    }
  }

  handleDisconnect(): void {
    // socket.io already cleans up room membership automatically on disconnect
  }

  emitOrderCreated(branchId: string, payload: { id: string; daily_number: number }): void {
    this.server.to(this.branchRoom(branchId)).emit('order:created', payload);
  }

  emitOrderUpdated(branchId: string, payload: { id: string; kitchen_status: string; cancelled_at: string | null }): void {
    this.server.to(this.branchRoom(branchId)).emit('order:updated', payload);
  }

  emitPaymentMatched(
    branchId: string,
    payload: { requestId: string; notificationId: string; amount: number; payerName: string; rawText: string },
  ): void {
    this.server.to(this.branchRoom(branchId)).emit('payment:matched', payload);
  }

  private branchRoom(branchId: string): string {
    return `branch:${branchId}`;
  }
}
