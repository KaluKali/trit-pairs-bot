const gmSettings = {
    imageMagick: true,
};
if (process.platform === 'win32') gmSettings.appPath = 'C:\\Program Files\\ImageMagick-7.0.10-Q16-HDRI\\';
const gm = require('gm').subClass(gmSettings);


const renderTableImage = (ctx, group_data,theme,cb) => {
    let config_theme =
        theme === 1 ? {
        font_color: 'white',
        background: 'black'
    } : {
        font_color: 'black',
        background: 'white'
    };

    let week_markups = [];

    for (let one_day in group_data['weekdays']) {
        let pangoMarkup = `\n<span foreground="${config_theme.font_color}"><b>${one_day[0].toUpperCase() + one_day.slice(1)} ${group_data['weekdays'][one_day]['date']}</b>\n`;
        let pairs_map = group_data['weekdays'][one_day]['pairs'].filter((_,index)=>index<5).map((pair,index)=>`<span foreground="${config_theme.font_color}">${index+1}. ${pair.name ? pair.name : '—'} каб. ${pair.room ? pair.room : '—'}</span>`)
        week_markups.push(`${pangoMarkup}${pairs_map.join('\n')}</span>`)
    }
    gm()
        .font('Liberation-Sans')
        .in('-background', config_theme.background)
        .in('-kerning','1')
        .out(`pango:<markup>${week_markups.filter((item, index)=>(index < 3)).join('')}</markup>`)
        .out('-orient','top-right')
        .borderColor(config_theme.background)
        .out('-border', '20x0')
        .out('+append')
        .out(`pango:<markup>${week_markups.filter((item, index)=>(index < 6 && index >= 3)).join('')}</markup>`)
        .out('-orient','top-right')
        .out('+append')
        .trim()
        .borderColor(config_theme.background)
        .out('-border', '20x20')
        .toBuffer('JPEG',cb);
}

module.exports = renderTableImage;
