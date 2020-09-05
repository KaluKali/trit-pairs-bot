const Markup = require('node-vk-bot-api/lib/markup');

function methods(reverse_markup, table_style, resources) {
    if (!reverse_markup) reverse_markup = Markup.keyboard([
        Markup.button('Расписание', 'positive'),
        Markup.button('Расписание на завтра', 'positive'),
        Markup.button('Настроить уведомления', 'primary'),
        Markup.button('Указать группу', 'primary'),
    ], {columns: 2}).oneTime();
    if (!table_style) table_style = { align: ['l', 'l', 'l' ], hsep: '  ' };

    let args = Object.keys(methods.arguments).map(key=>(methods.arguments[key]));
    return {
        pairs_day: require('./pair_now_day')(...args),
        find_pairs:require('./find_pairs')(...args),
        find_cabinet:require('./find_cabinet')(...args),
        mailing:require('./mailing')(...args),
        send_image:require('./send_image')(...args)
    }
}

module.exports = methods;
