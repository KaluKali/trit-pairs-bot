exports.Init = function (reverse_markup) {
    return [
        require('./group').ReverseMarkup(reverse_markup),
        require('./notify_c').ReverseMarkup(reverse_markup),
        require('./notify_e_d').ReverseMarkup(reverse_markup),
        require('./settings').ReverseMarkup(reverse_markup),
    ];
};