const Markup = require('node-vk-bot-api/lib/markup');

const rev_markup = Markup.keyboard([
    Markup.button('Расписание', 'positive'),
    Markup.button('Расписание на завтра', 'positive'),
    Markup.button('Настроить уведомления', 'primary'),
    Markup.button('Указать группу', 'primary'),
], {columns: 2}).oneTime()

function methods(reverse_markup=rev_markup, table_style= { align: ['l', 'l', 'l' ], hsep: '  ' }, resources) {

    let args = Object.keys(methods.arguments).map(key=>(methods.arguments[key]));
    return {
        pairs_day: require('./pair_now_day')(...args),
        find_pairs:require('./find_pairs')(...args),
        find_cabinet:require('./find_cabinet')(...args),
        mailing:require('./tasks/task_everyday_mailing')(...args),
        pairs_table:require('./pairs_table')(...args),
        changes_mailing:require('./tasks/task_changes_mailing')(...args),
        spam_into_conversations:require('./tasks/task_spam_into_conversations')(...args),
        send_image:require('./representation/send_image')(...args),
        send_image_changes:require('./representation/render_image_changes')(...args),
        send_text_changes:require('./representation/render_text_changes')(...args)
    }
}

module.exports = methods;
