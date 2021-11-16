import "reflect-metadata"
import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import session from "express-session"
import connectRedis from "connect-redis"
import Redis from "ioredis";
import cors from "cors"
import {createConnection} from 'typeorm'
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from "path";


const main = async () => {

    const conn = await createConnection({
        type:'postgres',
        database:'redit_main',
        username:'postgres',
        password:'123456',
        logging: true,
        synchronize: true,
        migrations:[path.join(__dirname,"./migrations/*")],
        entities:[Post,User]
    });

    await conn.runMigrations();

    const app = express();
    const redis = new Redis();
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
                client: redis,
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

    redis.on('error', (err) => console.log('Redis Client Error', err));


    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({ req, res,redis }),
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