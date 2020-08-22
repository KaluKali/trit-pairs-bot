const scenes = (reverse_markup) => {
    if (typeof reverse_markup === 'undefined') reverse_markup = Markup.keyboard([
        Markup.button('Расписание', 'positive'),
        Markup.button('Расписание на завтра', 'positive'),
        Markup.button('Настроить уведомления', 'primary'),
        Markup.button('Указать группу', 'primary'),
    ], {columns: 2}).oneTime();

    return [
        require('./group')(reverse_markup),
        require('./notification/notify_c')(reverse_markup),
        require('./notification/notify_e_d')(reverse_markup),
        require('./tune_bot')(reverse_markup),
        require('./settings')(reverse_markup),
        require('./notification/choice_notify')(reverse_markup),
        require('./erase_account_data')(reverse_markup),
        require('./unknown_command')(reverse_markup),
        require('./week')(reverse_markup),
    ];
};

module.exports = scenes;
