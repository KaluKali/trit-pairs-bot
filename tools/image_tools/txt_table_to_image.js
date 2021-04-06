const gmSettings = {
    imageMagick: true,
};
if (process.platform === 'win32') gmSettings.appPath = 'C:\\Program Files\\ImageMagick-7.0.10-Q16-HDRI\\';
const gm = require('gm').subClass(gmSettings);

const txtTableToImage = (text, theme, cb) => {
    let config_theme =
        theme === 1 ? {
            font_color: 'white',
            background: 'black'
        } : {
            font_color: 'black',
            background: 'white'
        };

    gm(2200, 1000, config_theme.background)
        .font('Liberation-Sans')
        .fill(config_theme.font_color)
        .in('-background', config_theme.background)
        .in('-kerning','1')
        .in('-gravity', 'west')
        .out('-orient','top-right')
        .out(`caption:${text}`)
        .out('-composite')
        .out('-trim')
        .borderColor(config_theme.background)
        .border(20,20)
        .toBuffer('JPEG', cb);
};

module.exports = txtTableToImage;
