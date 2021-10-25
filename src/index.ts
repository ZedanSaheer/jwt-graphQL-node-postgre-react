import "reflect-metadata";
import express from 'express';
import "dotenv/config"
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolvers";
import { createConnection } from "typeorm";


(async () => {
    const app = express();
    app.get("/", (_req, res) => res.send("Hello"));

    await createConnection();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver]
        }),
        context:({req,res})=>({req,res})
    });

    await apolloServer.start();

    apolloServer.applyMiddleware({ app });

    app.listen(5000, () => {
        console.log("server started!");
    });
})()

