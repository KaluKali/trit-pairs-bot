exports.Init = function (reverse_markup) {
    return {
        pairsday:require('./pairsDay').ReverseMarkup(reverse_markup),
        findpairs:require('./findPairs').ReverseMarkup(reverse_markup),
        sendingpairs:require('./sendingPairs').ReverseMarkup(reverse_markup),
    }
}