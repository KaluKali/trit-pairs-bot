const Markup = require('node-vk-bot-api/lib/markup');

const table = require('text-table');

const TritData = require('../trit_data');

const levenshtein = require('../tools/levenshtein')
const bigrams = require('../tools/bigrams')

const trit_data = new TritData();


const abbreviation = [
    "ТПЦМИ",
    "РЦС",
    "ОТ",
    "МДК",
    "РПУ",
    "ОГСЭ",
    "ТМУБиПРТ",
    "ТВМиДУиЭРиРА",
    "ТОиРРА",
    "ТМнМСсПУ",
    "ТИРНТОиРТА",
    "МНиРУиБРТ",

]

function isAbbreviation(txt){
    const txt_u = txt.toLowerCase()
    for (let abb of abbreviation){
        let abb_u = abb.toLowerCase()
        if (abb_u.length >3){
            if (levenshtein(txt_u,abb_u) <=2 && abb_u.indexOf(txt_u) === -1) return abb_u;
            else if (abb_u.indexOf(txt_u) !== -1){ return abb_u;}
        } else {
            if (levenshtein(txt_u,abb_u) <=1 && abb_u.indexOf(txt_u) === -1) return abb_u;
            else if (abb_u.indexOf(txt_u) !== -1){ return abb_u;}
        }
    }
    return false;
}

exports.ReverseMarkup = (reverse_markup) => {
    if (typeof reverse_markup === 'undefined') {
        reverse_markup = Markup.keyboard([
            Markup.button('Расписание', 'positive'),
            Markup.button('Расписание на завтра', 'positive'),
            Markup.button('Настроить уведомления', 'primary'),
            Markup.button('Указать группу', 'primary'),
        ], {columns: 2}).oneTime()
    }
    return async (ctx,obj)=>{
        if (typeof obj !== 'undefined' || typeof ctx !== 'undefined'){
            if (obj.pair === ""){
                return ctx.reply('Ты не указал какую пару нужно найти!',null,reverse_markup);
            }
        } else {
            return new Error('find_Pairs: Argument error');
        }
        const numbers = [0,1,2,3,4,5,6,7,8,9]
        const pair = obj.pair;
        const group = obj.group;
        const weekday = obj.weekday !== "" ? obj.weekday : -1;

        trit_data.getData((data) => {
            const fin = [];
            TritData.ValidGroups().forEach((group_f) => {
                for (let weekday_f in data[group_f]['weekdays']){ // data[group_f] is not iterable
                    data[group_f]['weekdays'][weekday_f].pairs.forEach((pair_f)=> {
                        if (pair_f.name === false) return;
                        pair_f.name = pair_f.name.replace(/ {1,}/g,' ');

                        let pair_f_low = pair_f.name.toLowerCase().split(' ');
                        let pair_p_low = pair.toLowerCase().split(' ');

                        // console.log(pair_f_low, pair_f.room,group_f)

                        pair_f_low.forEach((pf,pfi)=>{
                            if (pf.length > 1){
                                // pfil - pairs func i lower
                                pair_p_low.forEach((pp,ppi)=>{
                                    if (levenshtein(pf,pp) <=2){
                                        for (let ii of numbers) if (pp.indexOf(ii) !== -1) return;
                                        if (!isAbbreviation(pp)){
                                            return pair_p_low[ppi] = pf;
                                        } else {
                                            return pair_p_low[ppi] = isAbbreviation(pp);
                                        }
                                    } else {
                                        if (isAbbreviation(pp)) return pair_p_low[ppi] = isAbbreviation(pp);
                                        if (pf.indexOf(pp) !== -1) return pair_p_low[ppi] = pp;
                                    }
                                });
                            }
                        });

                        let pair_p_low_j = pair_p_low.join(' ');
                        if (pair_f.name.toLowerCase().indexOf(pair_p_low_j) !== -1){
                            return fin.push([pair_f.name,weekday_f,group_f]);
                        }
                    });
                }
            });

            let s_response;
            if (group !== -1 && weekday !== -1) s_response = fin.filter(obj_f => obj_f[2] == group && obj_f[1] == weekday);
            else {
                if (group == -1 && weekday !== -1) s_response = fin.filter(obj_f => obj_f[1] == weekday);
                else {
                    if (group !== -1 && weekday == -1) s_response = fin.filter(obj_f => obj_f[2] == group);
                    else s_response = fin;
                }
            }
            if (s_response.length > 24){
                return ctx.reply(`Найдено слишком много результатов!`,null,reverse_markup);
            } else {
                const t = table(s_response, { align: [ 'r', 'c', 'l' ], hsep: ' || ' });
                return ctx.reply(`Список пар, найденных на ${weekday == -1 ? 'всю неделю' : weekday} у ${group == -1 ? 'всех групп' : `группы ${group}`}:\n\n${t}`,null,reverse_markup);
            }
        });
    }
}