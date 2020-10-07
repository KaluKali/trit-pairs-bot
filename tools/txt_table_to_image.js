const gmSettings = {
    imageMagick: true,
};
if (process.platform === 'win32') gmSettings.appPath = 'C:\\Program Files\\ImageMagick-7.0.10-Q16-HDRI\\';
const gm = require('gm').subClass(gmSettings);

const txt_table_to_image = (text, theme, cb) => {

    let config_theme;

    if (theme === 1) {
        config_theme = {
            font_color: 'white',
            background: 'black'
        };
    } else {
        config_theme = {
            font_color: 'black',
            background: 'white'
        };
    }
    gm(2200, 1500, config_theme.background)
        .fill(config_theme.font_color)
        .in('-pointsize',46)
        .in('-background', config_theme.background)
        .in('-kerning','1')
        .in('-gravity', 'west')
        .in('-size','2200x')
        .out(`caption:${text}`)
        .out('-composite')
        .out('-trim')
        .borderColor(config_theme.background)
        .border(20,20)
        .toBuffer('JPEG', cb);

};

module.exports = txt_table_to_image;
