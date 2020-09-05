function scenes(reverse_markup, table_style, resources) {
    if (!reverse_markup) reverse_markup = Markup.keyboard([
        Markup.button('Расписание', 'positive'),
        Markup.button('Расписание на завтра', 'positive'),
        Markup.button('Настроить уведомления', 'primary'),
        Markup.button('Указать группу', 'primary'),
    ], {columns: 2}).oneTime();
    if (!table_style) table_style = { align: ['l', 'l', 'l' ], hsep: '  ' };

    let args = Object.keys(scenes.arguments).map(key=>(scenes.arguments[key]));
    return [
        require('./group')(...args),
        require('./notification/notify_c')(...args),
        require('./notification/notify_e_d')(...args),
        require('./tune_bot')(...args),
        require('./settings')(...args),
        require('./notification/choice_notify')(...args),
        require('./erase_account_data')(...args),
        require('./unknown_command')(...args),
        require('./week')(...args),
        require('./theme')(...args),
    ];
}

module.exports = scenes;
