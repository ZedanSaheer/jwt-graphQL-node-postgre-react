"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendMail(to, html) {
    let transporter = nodemailer_1.default.createTransport({
        service: 'Gmail',
        host: 'smtp.gmail.com',
        secure: false,
        auth: {
            user: "zedanforgames@gmail.com",
            pass: "Zedan007",
        },
    });
    let info = await transporter.sendMail({
        from: '"ZS Company" <foo@example.com>',
        to: to,
        subject: "Change Password",
        html,
    });
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer_1.default.getTestMessageUrl(info));
}
exports.sendMail = sendMail;
//# sourceMappingURL=sendEmail.js.map