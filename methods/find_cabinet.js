const table = require('text-table');
const TritData = require('../trit_data');
const trit_data = new TritData();

const find_cabinet = (reverse_markup, table_style) => {
    return async (ctx, obj) => { //send pairs to people
        if (typeof ctx === 'undefined' || typeof obj === 'undefined'){
            return new Error('pairs_Day: Argument error');
        }
        if (obj.cab === '') return ctx.reply('Вы не указали кабинет!', null, reverse_markup);

        const weekday = obj.weekday;
        const cabinet = obj.cab;

        trit_data.getData( (data) => {
            let cabs=[];
            for (let i of Object.keys(data)){
                if (weekday === ""){
                    for (let ii of Object.keys(data[i]['weekdays'])){
                        for (let iii of Object.keys(data[i]['weekdays'][ii])){
                            for (let iiii of data[i]['weekdays'][ii]['pairs']){
                                if (iiii['room'] && iiii['room'].indexOf(cabinet)!== -1){
                                    cabs.push([iiii['room'],iiii['name']]);
                                }
                            }
                        }
                    }
                } else {
                    for (let iiii of data[i]['weekdays'][weekday]['pairs']){
                        if (iiii['room'] && iiii['room'].indexOf(cabinet)!== -1){
                            cabs.push([iiii['room'],iiii['name']]);
                        }
                    }
                }
            }

            const t = table(cabs,table_style);
            ctx.reply(`Список уроков для кабинета №${cabinet} на ${weekday !== "" ? weekday : "всю неделю"}.\n\n${t.toString()}`,null,reverse_markup);
        });
    }
};

module.exports = find_cabinet;