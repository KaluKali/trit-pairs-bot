const Markup = require('node-vk-bot-api/lib/markup');

const obj = {
    type:'carousel',
    elements:[
        {
            title:'Расписание',
            description: "Ваша жизнь на неделю",
            photo_id: "-190098834_457239035",
            action:{
                type: 'open_photo'
            },
            buttons:[
                Markup.button('Расписание на сегодня', 'positive'),
                Markup.button('Расписание на завтра', 'primary'),
                Markup.button('Расписание на неделю', 'secondary')
            ]
        },
        {
            title:'Поиск',
            description: "Найдется все",
            photo_id: "-190098834_457239034",
            action:{
                type: 'open_photo'
            },
            buttons:[
                Markup.button('Найти пару', 'positive'),
                Markup.button('Найти пару', 'positive'),
                Markup.button('Найти пару', 'positive')
            ]
        },
        {
            title:'Настройки',
            description: "Уведомления, рассылка и ежедневное расписание",
            photo_id: "-190098834_457239036",
            action:{
                type: 'open_photo'
            },
            buttons:[
                Markup.button('Настроить бота', 'positive'),
                Markup.button('Настроить уведомления', 'primary'),
                Markup.button('Указать группу', 'secondary')
            ]
        },
    ]
}
module.exports = obj