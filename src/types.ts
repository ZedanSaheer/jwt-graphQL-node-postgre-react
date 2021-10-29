import { IDatabaseDriver, Connection } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/core";

export type MyContext = {
    em:EntityManager & EntityManager<IDatabaseDriver<Connection>>
}