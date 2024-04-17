import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway({
  cors: {
    origin: '*', //www.midominio.com
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  handleDisconnect(client: Socket) {
    console.log('un usuario se a desconectado de SOCKET.IO', client.id);
    this.server.emit('driver_disconnected', {
      id_socket: client.id,
    });
  }
  handleConnection(client: Socket, ...args: any[]) {
    console.log('un usuario se a conectado de SOCKET.IO', client.id);
  }

  @SubscribeMessage('message')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    console.log('nuevo mensaje: ', data);
    client.emit('new_message', 'Bien gracias');
  }

  @SubscribeMessage('change_driver_position')
  handleChangeDriverPosition(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    console.log('nueva posicion: ', data);
    this.server.emit('new_driver_position', {
      id_socket: client.id,
      id: data.id,
      lat: data.lat,
      lng: data.lng,
    });
  }
}
