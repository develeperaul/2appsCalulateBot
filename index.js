
const TelegramBot = require('node-telegram-bot-api')
const nodemailer = require("nodemailer")
const data = require('./data.json').data
const token = '5091648941:AAHoACEET84A0H7PrYbirfYJ_L7jX5B0bWU'
const bot = new TelegramBot(token, { polling: true, autoStart: true })
const buttons = {
    btns () {
        return [{ text: 'Назад', callback_data: '/prev' }, { text: 'Вперёд', callback_data: '/next' }]
    },
    prev () {
        return [{ text: 'Назад', callback_data: '/prev' }]
    },
    next () {
        return [{ text: 'Вперёд', callback_data: '/next' }]
    }
}
const choiceList = [];
let sum = 0;
const list = [];
let options = []
let current = 0;

// async..await is not allowed in global scope, must use a wrapper
async function main(textMail){

  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.yandex.ru",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "calculate2apps@yandex.ru", // generated ethereal user
      pass: "jrcocafmqdhmandt" // generated ethereal password
    }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: 'calculate2apps@yandex.ru', // sender address
    to: "info@2apps.ru", // list of receivers
    subject: "Hello ✔", // Subject line
    text: `${textMail}`, // plain text body
    //     html: `<b>${textMail}</b>`,
    // amp: `<!doctype html>
    // <html ⚡4email>
    //   <head>
    //     <meta charset="utf-8">
    //     <style amp4email-boilerplate>body{visibility:hidden}</style>
    //     <script async src="https://cdn.ampproject.org/v0.js"></script>
    //     <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
    //   </head>
    //   <body>
    //     <p>Image: <amp-img src="https://cldup.com/P0b1bUmEet.png" width="16" height="16"/></p>
    //     <p>GIF (requires "amp-anim" script in header):<br/>
    //       <amp-anim src="https://cldup.com/D72zpdwI-i.gif" width="500" height="350"/></p>
    //   </body>
    // </html>`
  });

  console.log("Message sent: %s", info.messageId);

}
const createOptions = (array, id, buttons, updateArr = true) => {

    let item
    if (updateArr) item = array.map(i => [{ text: i.title, callback_data: `${id}_${i.id}_${i.price ? i.price : i.koef}` }]);
    else item = array
    item = item.filter(i => i[0].callback_data !== '/prev')
    if (buttons && JSON.stringify(buttons) !== JSON.stringify(item[item.length - 1])) item.push(buttons);
    return JSON.stringify({
        inline_keyboard:
            item
    })

}
const inputData = {
    reply_markup: {

        keyboard: [
            [
                {
                    text: 'Заказать приложение',
                    request_contact: true
                }
            ]
        ]
    }

}
const gameOptions = {
    reply_markup: createOptions(data[current].options, data[current].id)
}
const textMsg = (json) => {

    return json ? `<b>${json.title}</b>\n${json.description}\n` : ''
}
const total = (json = false, array) => {
    return `${textMsg(json)}<pre>Приблизительная стоимость</pre>\n<b>${Math.ceil(array.reduce((a, b) => {
        if (a == 0) return a = b
        return a * b
    }, 0)).toFixed(0).replace(/[^0-9]/g, "").match(/.{1,3}(?=(.{3})*$)/g).join(' ')}</b> рублей`
}
const setOptions = (count,title, options) => {
    const current = 
        `${title}\n${options.join('')}`
    
    return choiceList.splice(count,1,current)
}
const start = () => {
    bot.on('message', async msg => {
        const text = msg.text
        const chatId = msg.chat.id
        
        if (text === '/start') {
            list.splice(0, list.length)
            sum = 0
            current = 0
            gameOptions.reply_markup = createOptions(data[current].options, data[current].id)
            


            return bot.sendMessage(chatId, '<pre> Рассчитать стоимость разработки</pre>', { parse_mode: 'HTML', ...gameOptions })
        }
        // if(msg.contact)
        if (msg.contact) {
            // main("Рассчитать стоимость разработки").catch(console.error);

            return bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/f38/7e7/f387e7a9-deef-4dfe-8d1a-23a07a56e409/6.webp')
        }
        if (msg.entities&&msg.entities[0].type == 'phone_number') {
            // Название шага Выберите платформу опции
            await bot.sendMessage(chatId, JSON.stringify([list, total(false, list), choiceList, msg.chat.first_name, msg.chat.username]))
            
            // "text\n&nbsp;option\n&nbsp;option\ntext\n&nbsp;option\n&nbsp;option\n"
            console.log(choiceList.join(""))
            main(choiceList.join("")).catch(console.error);
            return bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/f38/7e7/f387e7a9-deef-4dfe-8d1a-23a07a56e409/6.webp')
        }
        if (text) {
        }

        await bot.deleteMessage(chatId, msg.message_id - 1)
        await bot.deleteMessage(chatId, msg.message_id)
        return bot.sendMessage(chatId, 'Я вас не понимаю, попробуйте еще раз')
    })
    bot.on('callback_query', async msg => {
       
        const { message: { chat, message_id } } = msg

        if (msg.data !== '/next' && msg.data !== '/prev') {
            sum = sum + Number(msg.data.split('_')[2])
        }
        await bot.deleteMessage(chat.id, message_id)

        if (data.length - 1 == current) {
            console.log(msg)
            return bot.sendMessage(chat.id, total(data[current], list), { parse_mode: 'HTML', ...inputData })
        }

        if (msg.data == '/next') {
            options = []
            sum = 0
            current++
            gameOptions.reply_markup = createOptions(data[current].options, data[current].id, buttons.prev())
            return bot.sendMessage(chat.id, total(data[current], list), { parse_mode: 'HTML', ...gameOptions })
        }
        if (msg.data == '/prev') {
            if (list.length > current) {
                list.splice(list.length - 1, 1)
                choiceList.splice(choiceList.length - 1, 1)
                
            }
            current--
            list.splice(current, 1)
            choiceList.splice(current, 1)
            if (current == 0) gameOptions.reply_markup = createOptions(data[current].options, data[current].id)
            else gameOptions.reply_markup = createOptions(data[current].options, data[current].id, buttons.prev())
            return bot.sendMessage(chat.id, total(data[current], list), { parse_mode: 'HTML', ...gameOptions })
        }
        if (data[current].multicheckbox) {
            const newOption = JSON.parse(gameOptions.reply_markup).inline_keyboard.filter(i => i[0].callback_data !== msg.data)

            if (newOption.length == 0) {
                list.push(sum)
                
                sum = 0
                current++
                gameOptions.reply_markup = createOptions(newOption, data[current].id, buttons.btns(), false)
                return bot.sendMessage(chat.id, total(data[current], list), { parse_mode: 'HTML', ...gameOptions })
            } else {
                list.push(sum)
                options.push(`\t${data[current].options.find(i=>i.id==msg.data.split('_')[1]).title}\n`)
                setOptions(current,data[current].title,options)
                
                if (current == 0) gameOptions.reply_markup = createOptions(newOption, data[current].id, buttons.next(), false)
                else gameOptions.reply_markup = createOptions(newOption, data[current].id, buttons.btns(), false)
                return bot.sendMessage(chat.id, total(data[current], list), { parse_mode: 'HTML', ...gameOptions })

            }
        } else {
            list.push(sum)
            
            options.push(`\t${data[current].options.find(i=>i.id==msg.data.split('_')[1]).title}\n`)
            setOptions(current,data[current].title,options)
            options = []
            sum = 0
            current++
            gameOptions.reply_markup = createOptions(data[current].options, data[current].id, buttons.prev())
            // console.log(msg)
            return bot.sendMessage(chat.id, total(data[current], list), { parse_mode: 'HTML', ...gameOptions })
        }


    })
}
start()

