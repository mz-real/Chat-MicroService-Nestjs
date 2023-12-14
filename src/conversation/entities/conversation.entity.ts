import { Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany, Column } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Message } from 'src/messages/entities/message.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  ticketId: string;

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[];

  @OneToMany(() => Message, message => message.conversation)
  messages: Message[];

  @Column({default: () => 'CURRENT_TIMESTAMP'})
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

}
