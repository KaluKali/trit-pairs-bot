const gmSettings = {
    imageMagick: true,
};
if (process.platform === 'win32') gmSettings.appPath = 'C:\\Program Files\\ImageMagick-7.0.10-Q16-HDRI\\';
const gm = require('gm').subClass(gmSettings);


const sendImageChanges = () => {
    return async (data_changes, group_filter=[], callback) => {
        const TITLE_INDENT = 3;

        let week_markups = [];


        for (let one_day in data_changes) {
            if (Object.keys(data_changes[one_day].changes).length) {
                let pangoMarkup = `\n<span><b>${one_day[0].toUpperCase() + one_day.slice(1)}</b>\n\n`;
                const groupChangesFiltred = Object.keys(data_changes[one_day].changes).filter(group=>group_filter.length ? group_filter.includes(parseInt(group)) : true);
                if (groupChangesFiltred.length) {
                    groupChangesFiltred.forEach(group=>{
                        pangoMarkup += `\nГруппа ${group}\n\n`;
                        for (let pairIndex in data_changes[one_day].changes[group]){
                            const modify_pair = data_changes[one_day].changes[group][pairIndex];
                            let stock = `${modify_pair.stock.name ? modify_pair.stock.name : '—'} ${modify_pair.stock.room ? `  каб. ${modify_pair.stock.room}` : '  каб. —'}`;
                            let modify = `${modify_pair.modified.name ? modify_pair.modified.name : '—'} ${modify_pair.modified.room ? `  каб. ${modify_pair.modified.room}` : '  каб. —'}`;
                            pangoMarkup += `${pairIndex}. <span background="lightgreen">${stock}</span><s>${modify}</s>\n`
                        }
                    });
                } else return callback(null,null);
                week_markups.push(pangoMarkup);
            }
        }

        // выравнивание дней недели по вертикали
        if (week_markups[0] && week_markups[3]) {
            let monday_indent = week_markups[0].split('\n').length-TITLE_INDENT;
            let thursday_indent = week_markups[3].split('\n').length-TITLE_INDENT;

            if (monday_indent > thursday_indent) {
                for (let i = monday_indent - thursday_indent; i>0; i--) week_markups[3] += '\n'
            } else {
                for (let i = thursday_indent - monday_indent; i>0; i--) week_markups[0] += '\n'
            }
        }
        if (week_markups[1] && week_markups[4]) {
            let tuesday_indent = week_markups[1].split('\n').length-TITLE_INDENT;
            let friday_indent = week_markups[4].split('\n').length-TITLE_INDENT;

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
            .toBuffer('JPEG',(err,buffer)=>callback(err,buffer));
    }
};

module.exports = sendImageChanges;
