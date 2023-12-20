import { Notification } from 'src/notifications/notification.entity/notification.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
  Client = 'client',
  Staff = 'staff',
}

export enum UserStatus {
  Offline = 'offline',
  Online = 'online',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.Client
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.Offline
  })
  status: UserStatus;
  @OneToMany(() => Notification, notification => notification.user, {nullable: true}) 
  notifications: Notification[];
  
}
