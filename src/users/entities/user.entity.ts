import { Conversation } from 'src/conversation/entities/conversation.entity';
import { WebSocketConnection } from 'src/websockeconnection/entities/websockeconnection.entity/websockeconnection.entity';
import { Entity, PrimaryColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';


@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column()
  email: string;

  @Column()
  role: string;

  @OneToMany(() => WebSocketConnection, (connection) => connection.user)
  connections: WebSocketConnection[];

  @ManyToMany(() => Conversation)
  @JoinTable()
  conversations: Conversation[];

  // Other user-related fields and relationships
}
