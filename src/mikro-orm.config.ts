import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core";

export default {
    entities:[Post],
    dbName:'redit',
    
    user:'postgres',
    password:'123456',
    debug:!__prod__,
    type:"postgresql"
} as Parameters<typeof MikroORM.init>[0];

