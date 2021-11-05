"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20211104151858 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20211104151858 extends migrations_1.Migration {
    async up() {
        this.addSql('alter table "user" add column "email" text not null;');
        this.addSql('alter table "user" add constraint "user_email_unique" unique ("email");');
    }
}
exports.Migration20211104151858 = Migration20211104151858;
//# sourceMappingURL=Migration20211104151858.js.map