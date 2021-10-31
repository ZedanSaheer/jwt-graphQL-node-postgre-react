import { IDatabaseDriver, Connection } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/core";
import { Request, Response } from "express"

export type MyContext = {
    em: EntityManager & EntityManager<IDatabaseDriver<Connection>>;
    req: Request & {session: Express.Session};
    res: Response;
}