import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./events";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket() {
  return io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
    transports: ["websocket"]
  }) as AppSocket;
}
