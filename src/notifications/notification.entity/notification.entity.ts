import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, conversation => conversation.notifications)
  conversation: Conversation;

  @Column()
  content: string;

  @Column({ default: false })
  acknowledged: boolean;

  @Column({ default: false })
  dismissed: boolean;

  @ManyToOne(() => User, user => user.notifications) 
  user: User; 
}
