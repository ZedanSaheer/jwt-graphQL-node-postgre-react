import "reflect-metadata"
import { MikroORM } from "@mikro-orm/core"
import { COOKIE_NAME, __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";
import express from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from "redis";
import session from "express-session"
import connectRedis from "connect-redis"
import cors from "cors"


const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();
    const app = express();
    const redisClient = redis.createClient();
    const RedisStore = connectRedis(session);

    app.use(cors({
        origin:"http://localhost:3000",
        credentials:true,
    }),
    )

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({
                client: redisClient,
                disableTouch: true,
                disableTTL: true
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10 //10 years
                ,
                httpOnly: true,
                sameSite: 'lax', //shield csrf
                secure: __prod__ //only in https

            },
            secret: 'fnaofoewjfsdofjadk',
            resave: false,
            saveUninitialized: false,
        })
    )

    redisClient.on('error', (err) => console.log('Redis Client Error', err));


    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({ em: orm.em, req, res }),
    })

    await apolloServer.applyMiddleware({ app ,
        cors:false,
    });

    app.listen(5000, () => {
        console.log("Server started");

    });
};

main().catch((err) => {
    console.log(err);

});