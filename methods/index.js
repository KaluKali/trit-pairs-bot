const Markup = require('node-vk-bot-api/lib/markup');

const methods = function (reverse_markup,table_style) {
    if (typeof reverse_markup === 'undefined') reverse_markup = Markup.keyboard([
        Markup.button('Расписание', 'positive'),
        Markup.button('Расписание на завтра', 'positive'),
        Markup.button('Настроить уведомления', 'primary'),
        Markup.button('Указать группу', 'primary'),
    ], {columns: 2}).oneTime();
    if (typeof table_style === 'undefined') table_style = { align: [ 'r', 'c', 'l' ], hsep: ' || ' };

    return {
        pairs_day:require('./pairs_now_day')(reverse_markup,table_style),
        find_pairs:require('./find_pairs')(reverse_markup,table_style),
        mailing:require('./mailing')(reverse_markup,table_style),
    }
};

module.exports = methods;