import { Field, Int, ObjectType } from "type-graphql";
import {Entity,PrimaryGeneratedColumn,CreateDateColumn,Column,UpdateDateColumn,BaseEntity} from "typeorm"

@ObjectType()
@Entity()
export class Post extends BaseEntity {
    @Field(()=>Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(()=>String)
    @CreateDateColumn()
    createdAt= new Date();

    @Field(()=>String)
    @UpdateDateColumn()
    updatedAt= new Date();

    @Field()
    @Column()
    title!: string;
}