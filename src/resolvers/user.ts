import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import argon2 from "argon2"
import { User } from "../entities/User";

@InputType()
class UsernameAndPasswordInput {
    @Field()
    username : string
    @Field()
    password : string
}

@ObjectType()
class FieldError{
    @Field()
    field : string;
    @Field()
    message : string;
}

@ObjectType()
class UserResponse{
    @Field(()=>[FieldError],{nullable:true})
    errors?:FieldError[];

    @Field(()=>User,{nullable:true})
    user?:User;
}

@Resolver()
export class UserResolver {
    @Mutation(()=>UserResponse)
    async register(
        @Arg('options') options : UsernameAndPasswordInput,
        @Ctx() {em} : MyContext
    ):Promise<UserResponse>{
        if(options.username.length<=2){
            return{
                errors:[
                    {
                        field:"username",
                        message : "lenght must be greater than 2"
                    }
                ]
            }
        }
        if(options.password.length<=3){
            return{
                errors:[
                    {
                        field:"password",
                        message : "lenght must be greater than 3"
                    }
                ]
            }
        }
        const hasedPass = await argon2.hash(options.password)
        const user = em.create(User ,
             {username : options.username , password: hasedPass});
       try {
        await em.persistAndFlush(user);
       } catch (error) {
           //duplicate user
          if(error.code==='23505' || error.detail.includes("already exists")){
              return {
                  errors:[{
                      field:"username",
                      message:"username already in use"
                  }]
              }
          }
       }
        return {user,}
    }
    
    @Mutation(()=>UserResponse)
    async login(
        @Arg('options') options : UsernameAndPasswordInput,
        @Ctx() {em} : MyContext
    ): Promise<UserResponse>{
        const user = await em.findOne(User,{username:options.username.toLowerCase()});
        if(!user){
            return{
                errors:[{
                    field : 'username'
                    ,message: 'username does not exist!'
                }]
            }
        }
        const valid = await argon2.verify(user.password , options.password);
        if(!valid){
            return{
                errors:[{
                    field : 'password'
                    ,message: 'password does not match!'
                }]
            }
        }

        return {
            user,
        }
    }
    
}