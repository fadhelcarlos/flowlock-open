import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  product_id: string;

  @Column('uuid')
  user_id: string;

  @Column('int')
  rating: number;

  @Column('text', { nullable: true })
  comment: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Product, product => product.reviews)
  product: Product;

  @ManyToOne(() => User)
  user: User;
}