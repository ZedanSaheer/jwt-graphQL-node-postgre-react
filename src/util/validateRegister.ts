import { UsernameAndPasswordInput } from "./UsernameAndPasswordInput"

export const validateRegister = (options: UsernameAndPasswordInput) => {
    if (options.email.includes('@')) {
        return [
            {
                field: "email",
                message: "invalid email!"
            }
        ]
    }
    if (options.username.length <= 2) {
        return [
            {
                field: "username",
                message: "Lenght must be greater than 2"
            }
        ]
    }
    if (options.password.length <= 3) {
        return [
            {
                field: "password",
                message: "Lenght must be greater than 3"
            }
        ]
    }
    if (options.username.includes('@')) {
        return [
            {
                field: "username",
                message: "cannot add '@' for"
            }
        ]
    }

    return null;
}