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
                    for (let wd of Object.keys(data[i]['weekdays'])){
                        for (let item of data[i]['weekdays'][wd]['pairs']){
                            if (item['room'] && item['room'].indexOf(cabinet)!== -1){
                                cabs.push([item['room'], i, wd, item['name']]);
                            }
                        }
                    }
                } else {
                    for (let item of data[i]['weekdays'][weekday]['pairs']){
                        if (item['room'] && item['room'].indexOf(cabinet)!== -1){
                            cabs.push([item['room'], i,item['name']]);
                        }
                    }
                }
            }

            const t = table(cabs,table_style);
            ctx.reply(`Список пар для кабинета №${cabinet} на ${weekday !== "" ? weekday : "всю неделю"}.\n\n${t.toString()}`,null,reverse_markup);
        });
    }
};

module.exports = find_cabinet;