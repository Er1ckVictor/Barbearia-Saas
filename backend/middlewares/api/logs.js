import chalk from "chalk";

// Horário do log
export function logTime(nmaeFunction, message, data = "") {

    // Data atual
    const dateNow = new Date();

    // Data atual [dia,mes,ano]
    const day = String(dateNow.getDate()).padStart(2, '0');
    const month = String(dateNow.getMonth()).padStart(2, '0');
    const year = dateNow.getFullYear();

    // Horário atual [hora, minuto, segundos]
    const hour = String(dateNow.getHours()).padStart(2, '0');
    const minute = String(dateNow.getMinutes()).padStart(2, '0');
    const seconds = String(dateNow.getSeconds()).padStart(2, '0');
    const milliseconds = String(dateNow.getMilliseconds()).padStart(3, '0');

    return `${chalk.gray(`${year}.${month}.${day} ${hour}:${minute}:${seconds}:${milliseconds}`)} ${chalk.yellow(`[${nmaeFunction}]`)} ${message} ${data}`

}