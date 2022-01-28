const TelegramBot = require('node-telegram-bot-api')
const data = require('./data.json').data
const token = '5091648941:AAHwJIg8ADsME3ad1sQcEmU0IR1BhxmrdsE'
const bot = new TelegramBot(token, {polling: true,autoStart:true})
const buttons = {
    btns(){
        return [{text: 'Назад', callback_data: '/prev'},{text: 'Вперёд', callback_data: '/next'}]
    },
    prev(){
        return [{text: 'Назад', callback_data: '/prev'}]
    },
    next(){
        return [{text: 'Вперёд', callback_data: '/next'}]
    }
}
const choiceList=[];
let sum = 0;
const list = [];
let current = 0;
const createOptions = (array, id, buttons, updateArr=true) => {
    
    let item 
    if(updateArr)item=array.map(i=>[{text: i.title, callback_data: `${id}_${i.id}_${i.price?i.price:i.koef}`}]);
    else item=array
    item = item.filter(i=>i[0].callback_data !== '/prev')
    if(buttons&&JSON.stringify(buttons)!==JSON.stringify(item[item.length-1]))item.push(buttons);
    return JSON.stringify({
        inline_keyboard: 
            item
    })
    
}
const inputData = {
    reply_markup: {

        keyboard:[
            [
                {text: 'Заказать приложение',
                request_contact:true
                }
            ]
        ]
    }
    
}
const gameOptions = {
        reply_markup: createOptions(data[current].options, data[current].id)
    }
const textMsg=(json)=>{
    
    return json?`<b>${json.title}</b>\n${json.description}\n`:''
}
const total = (json=false,array)=>{
    return `${textMsg(json)}<pre>Приблизительная стоимость</pre>\n<b>${Math.ceil(array.reduce((a,b)=>{
        if(a == 0)return a=b
        return a*b
    },0)).toFixed(0).replace(/[^0-9]/g, "").match(/.{1,3}(?=(.{3})*$)/g).join(' ')}</b> рублей`
}
const start = () =>{
    let msgId
    bot.on('message', async msg =>{
        const text = msg.text
        const chatId = msg.chat.id
        if(text === '/start'){
            list.splice(0,list.length)
            sum = 0
            current = 0
            gameOptions.reply_markup = createOptions(data[current].options, data[current].id)
            console.log(msg)


            return bot.sendMessage(chatId, '<pre> Рассчитать стоимость разработки</pre>', {parse_mode: 'HTML',...gameOptions})
        }
        // if(msg.contact)
        if(msg.contact){
            return bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/f38/7e7/f387e7a9-deef-4dfe-8d1a-23a07a56e409/6.webp')
        }
        if(msg?.entities&&msg.entities[0].type == 'phone_number'){
            console.log('hi')
            await bot.sendMessage(chatId, JSON.stringify([list,total(false,list),choiceList,msg.chat.first_name,msg.chat.username]))
            return bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/f38/7e7/f387e7a9-deef-4dfe-8d1a-23a07a56e409/6.webp')
        }
        console.log(msg)

        await bot.deleteMessage(chatId, msg.message_id-1)
        await bot.deleteMessage(chatId, msg.message_id)
        return bot.sendMessage(chatId, 'Я вас не понимаю, попробуйте еще раз')
    })
    bot.on('callback_query', async msg => {

        const {message: {chat,message_id}} = msg

        if(msg.data!=='/next'&&msg.data!=='/prev'){
            sum=sum + Number(msg.data.split('_')[2])
        }
        await bot.deleteMessage(chat.id, message_id)
        
        if(data.length-1 == current){    
            console.log(msg)
            return bot.sendMessage(chat.id, total(data[current],list), {parse_mode: 'HTML',...inputData})
        }

        if(msg.data == '/next'){
            // list.push(sum)
            
            sum = 0
            current++
            gameOptions.reply_markup = createOptions(data[current].options, data[current].id, buttons.prev())
            console.log(msg)
            return bot.sendMessage(chat.id, total(data[current],list), {parse_mode: 'HTML',...gameOptions})
        }
        if(msg.data == '/prev'){
            if(list.length>current){
                list.splice(list.length-1,1)
                choiceList.splice(choiceList.length-1,1)
            }
            current--
            list.splice(current,1)
            choiceList.splice(current,1)
            if(current == 0)gameOptions.reply_markup = createOptions(data[current].options, data[current].id)
            else gameOptions.reply_markup = createOptions(data[current].options, data[current].id, buttons.prev())
            console.log(msg)
            return bot.sendMessage(chat.id, total(data[current],list), {parse_mode: 'HTML',...gameOptions})
        }
        if(data[current].multicheckbox){
            const newOption =  JSON.parse(gameOptions.reply_markup).inline_keyboard.filter(i=>i[0].callback_data!==msg.data)
            
            if(newOption.length == 0){
                list.push(sum)
                choiceList.push(msg.data)
                sum = 0
                current++
                gameOptions.reply_markup = createOptions(newOption, data[current].id,buttons.btns(),false)
                console.log(msg)
                return bot.sendMessage(chat.id, total(data[current],list), {parse_mode: 'HTML',...gameOptions})
            }else{
                list.splice(current,1,sum)
                choiceList.splice(current,1,msg.data)
                if(current==0)gameOptions.reply_markup = createOptions(newOption, data[current].id,buttons.next(),false)
                else gameOptions.reply_markup = createOptions(newOption, data[current].id,buttons.btns(),false)
                console.log(msg)
                return bot.sendMessage(chat.id, total(data[current],list), {parse_mode: 'HTML',...gameOptions})

            }
        }else{
                list.push(sum)
                choiceList.push(msg.data)
                sum = 0
                current++
                gameOptions.reply_markup = createOptions(data[current].options, data[current].id, buttons.prev())
                console.log(msg)
                return bot.sendMessage(chat.id, total(data[current],list), {parse_mode: 'HTML',...gameOptions})
        }
        
        
    })
}
start()

