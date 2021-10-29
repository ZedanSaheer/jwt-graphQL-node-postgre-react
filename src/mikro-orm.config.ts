import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { MikroORM } from "@mikro-orm/core";
import path from "path";

export default {
    migrations:{
        path: path.join(__dirname,'./migrations'), 
        pattern: /^[\w-]+\d+\.[tj]s$/, 
    },
    entities:[Post,User],
    dbName:'redit',
    user:'postgres',
    password:'123456',
    debug:!__prod__,
    type:"postgresql"
} as Parameters<typeof MikroORM.init>[0];

