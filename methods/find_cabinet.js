const table = require('text-table');

const find_cabinet = (reverse_markup, table_style, res) => {
    return async (ctx, message) => { //send pairs to people
        if (!ctx || !message) return new Error('pairs_Day: Argument error');
        if (message.cab === '') return ctx.reply('Вы не указали кабинет!', null, reverse_markup);

        const weekday = message.weekday;
        const cabinet = message.cab;

        res.data.getData((data) => {
            let cabs=[];
            for (let i of Object.keys(data)){
                if (weekday === ""){
                    for (let weekday of Object.keys(data[i]['weekdays'])){
                        cabs = [...cabs,...data[i]['weekdays'][weekday]['pairs']
                            .filter(item=>item.room === cabinet)
                            .map(item=>[item['name'], `гр.${i}`])]
                    }
                } else {
                    for (let pair of data[i]['weekdays'][weekday]['pairs']){
                        if (pair['room'] && pair['room'].indexOf(cabinet)!== -1){
                            cabs.push([pair['name'], `гр.${i}`]);
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
