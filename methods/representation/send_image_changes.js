const saveImageIntoVk = require('../../tools/image_tools/save_image_into_vk');
const gmSettings = {
    imageMagick: true,
};
if (process.platform === 'win32') gmSettings.appPath = 'C:\\Program Files\\ImageMagick-7.0.10-Q16-HDRI\\';
const gm = require('gm').subClass(gmSettings);

const sendImageChanges = () => {
    return async (data_changes, bot) => {
        let week_markups = [];
        const title_indent = 3;
        for (let one_day in data_changes) {
            if (Object.keys(data_changes[one_day].changes).length) {
                let pangoMarkup = `\n<span><b>${one_day[0].toUpperCase() + one_day.slice(1)}</b>\n\n`;
                Object.keys(data_changes[one_day].changes).forEach(group=>{
                    pangoMarkup += `\nГруппа ${group}\n\n`;
                    for (let pairIndex in data_changes[one_day].changes[group]){
                        const modify_pair = data_changes[one_day].changes[group][pairIndex];
                        let stock = `${modify_pair.stock.name ? modify_pair.stock.name : '—'} ${modify_pair.stock.room ? `  каб. ${modify_pair.stock.room}` : '  каб. —'}`;
                        let modify = `${modify_pair.modified.name ? modify_pair.modified.name : '—'} ${modify_pair.modified.room ? `  каб. ${modify_pair.modified.room}` : '  каб. —'}`;
                        pangoMarkup += `${pairIndex}. <span background="lightgreen">${modify}</span><s>${stock}</s>\n`
                    }
                });
                week_markups.push(pangoMarkup);
            }
        }

        // выравнивание дней недели по вертикали
        if (week_markups[0] && week_markups[3]) {
            let monday_indent = week_markups[0].split('\n').length-title_indent;
            let thursday_indent = week_markups[3].split('\n').length-title_indent;

            if (monday_indent > thursday_indent) {
                for (let i = monday_indent - thursday_indent; i>0; i--) week_markups[3] += '\n'
            } else {
                for (let i = thursday_indent - monday_indent; i>0; i--) week_markups[0] += '\n'
            }
        }
        if (week_markups[1] && week_markups[4]) {
            let tuesday_indent = week_markups[1].split('\n').length-title_indent;
            let friday_indent = week_markups[4].split('\n').length-title_indent;

            if (tuesday_indent > friday_indent) {
                for (let i = tuesday_indent - friday_indent; i>0; i--) week_markups[4] += '\n'
            } else {
                for (let i = friday_indent - tuesday_indent; i>0; i--) week_markups[1] += '\n'
            }
        }
        for (let i=0;i<week_markups.length;i++) week_markups[i] += '</span>';

        gm().out('-kerning','1')
            .out(`pango:<markup>${week_markups.filter((item, index)=>(index < 3)).join('')}</markup>`)
            .out('-orient','top-right').out('+append')
            .out(`pango:<markup>${week_markups.filter((item, index)=>(index < 6 && index >= 3)).join('')}</markup>`)
            .out('-orient','top-right').out('+append')
            .borderColor('#FFFFFF')
            .border(20,20)
            .toBuffer('JPEG',async (err,buffer)=>{
                if (err){
                    console.log(`toBuffer in main.js error: ${err}`);
                    for (let i = 1; i < process.env.TOTAL_CONVERSATION;i++){
                        await bot.execute('messages.send', {
                            peer_id: 2000000000+i, // <- inside account id-dialog, DONT unique
                            random_id: Math.floor(Math.random() * Math.floor(10000000000)),
                            message: 'Выложено новое расписание.',
                        }).catch(error => console.error(`Main.js error: ${error}`));
                    }
                } else {
                    await saveImageIntoVk(buffer,bot,async (photo_data)=>{
                        for (let i = 1; i < process.env.TOTAL_CONVERSATION;i++){
                            await bot.execute('messages.send', {
                                peer_id: 2000000000+i, // <- inside account id-dialog, DONT unique
                                random_id: Math.floor(Math.random() * Math.floor(10000000000)),
                                attachment: `photo${photo_data[0].owner_id}_${photo_data[0].id}`,
                            }).catch(error => console.error(error));
                        }
                    });
                }
            });
    }
};

module.exports = sendImageChanges;
