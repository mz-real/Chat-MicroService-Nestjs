import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';


@Entity()
export class WebSocketConnection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  connectionId: string;

  @ManyToOne(() => User, (user) => user.connections)
  user: User;

}

