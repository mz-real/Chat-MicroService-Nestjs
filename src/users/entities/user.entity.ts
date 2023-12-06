import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({unique: true})
  userId: string;

  @Column()
  email: string;

  @Column({enum: ['client', 'staff']})
  role: string;

  @Column({ default: 'offline', enum: ['offline', 'online']})
  status: string;
}