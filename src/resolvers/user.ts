import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2"
import { User } from "../entities/User";
import { MyContext } from "src/types"
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernameAndPasswordInput } from "../util/UsernameAndPasswordInput";
import { validateRegister } from "../util/validateRegister";
import { sendMail } from "../util/sendEmail";
import { v4 } from "uuid";
import {getConnection} from "typeorm"

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

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { redis ,req}: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 3) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message: "Lenght must be greater than 3"
                    },
                ]
            }
        }
        const key = FORGET_PASSWORD_PREFIX+token;
        const userId = await redis.get(key);
        if (!userId) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "Expired token , please try again!"
                    },
                ]
            }
        }

        const uid = parseInt(userId);
        const user = await User.findOne(uid);

        if (!user) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "User no longer exists"
                    },
                ]
            }
        }

        
        await User.update({id:uid},{password : await argon2.hash(newPassword)});    

        await redis.del(key);

        req.session.userId = user?.id;
        return{user};
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { redis }: MyContext
    ) {
        const user = await User.findOne({where :{email}});
        if (!user) {
            return true;
        }
        
        const token = v4();

        await redis.set(FORGET_PASSWORD_PREFIX+token, user.id);

        await sendMail(email, `<a href="http://localhost:3000/change-password/${token}">Reset Password </a>`);

        return true;
    }

    @Query(() => User, { nullable: true })
    me(
        @Ctx() { req }: MyContext
    ) {
        if (!req.session.userId) {
            return null
        }

        const user = User.findOne(req.session.userId);
        return user;
    }

    @Query(() => [User])
    user(
    ): Promise<User[]> {
        return User.find();
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernameAndPasswordInput,
        @Ctx() { req } : MyContext
    ): Promise<UserResponse> {

        const errors = validateRegister(options);

        if (errors) {
            return { errors };
        }
        
        const hasedPass = await argon2.hash(options.password);
        let user;
        try {
            const result = await getConnection().createQueryBuilder().insert().into(User).values(
               { username : options.username,
                email : options.email,
                password : hasedPass,}
            ).returning('*').execute();
            console.log(result);
            user = result.raw;
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
        req.session.userId = user.id
        return { user }
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('usernameOrEmail') userNameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne( userNameOrEmail.includes('@') ? { where :{email: userNameOrEmail }} : {where :{ username: userNameOrEmail} });
        if (!user) {
            return {
                errors: [{
                    field: 'usernameOrEmail'
                    , message: 'Username or Email does not exist!'
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