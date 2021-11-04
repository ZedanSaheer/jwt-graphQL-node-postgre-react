import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2"
import { User } from "../entities/User";
import { MyContext } from "src/types"
import { COOKIE_NAME } from "../constants";
import { UsernameAndPasswordInput } from "../util/UsernameAndPasswordInput";
import { validateRegister } from "../util/validateRegister";

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    @Mutation(()=> Boolean)
    async forgotPassword(
       /*  @Arg('email') email : string,
        @Ctx() {em} : MyContext */
    ){
        /* const user = await em.findOne(User,{email}); */
        return true;
    }

    @Query(() => User, { nullable: true })
    async me(
        @Ctx() { req, em }: MyContext
    ) {
        if (!req.session.userId) {
            return null
        }

        const user = await em.findOne(User, { id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernameAndPasswordInput,
        @Ctx() { em }: MyContext
    ): Promise<UserResponse> {

        const errors = validateRegister(options);

        if(errors){
            return {errors};
        }
        const hasedPass = await argon2.hash(options.password)
        const user = em.create(User,
            { username: options.username, password: hasedPass  , email:options.email});
        try {
            await em.persistAndFlush(user);
        } catch (error) {
            //duplicate user
            if (error.code === '23505' || error.detail.includes("Already exists")) {
                return {
                    errors: [{
                        field: "username",
                        message: "Username already in use"
                    }]
                }
            }
        }
        return { user, }
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('usernameOrEmail') userNameOrEmail : string,
        @Arg('password') password : string,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, userNameOrEmail.includes('@') ? { email : userNameOrEmail } : {username : userNameOrEmail});
        if (!user) {
            return {
                errors: [{
                    field: 'username'
                    , message: 'Username does not exist!'
                }]
            }
        }
        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return {
                errors: [{
                    field: 'password'
                    , message: 'Password does not match!'
                }]
            }
        }

        req.session.userId = user.id;

        return {
            user,
        };
    }

    @Mutation(() => Boolean)
    logout(
        @Ctx() { req, res }: MyContext
    ) {
        return new Promise((resolve) => req.session.destroy((err) => {
            res.clearCookie(COOKIE_NAME)
            if (err) {
                console.log(err);
                resolve(false)
                return
            }
            resolve(true)
        }));
    }
}