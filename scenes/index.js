exports.Init = function (reverse_markup) {
    return [
        require('./group').ReverseMarkup(reverse_markup),
        require('./notification/notify_c').ReverseMarkup(reverse_markup),
        require('./notification/notify_e_d').ReverseMarkup(reverse_markup),
        require('./tune_bot').ReverseMarkup(reverse_markup),
        require('./settings').ReverseMarkup(reverse_markup),
        require('./notification/choice_notify').ReverseMarkup(reverse_markup),
        require('./erase_account_data').ReverseMarkup(reverse_markup),
    ];
};