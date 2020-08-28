const gm = require('gm').subClass({imageMagick: true, appPath:'C:\\Program Files\\ImageMagick-7.0.10-Q16-HDRI\\'});

const textToImage = (text, theme, cb) => {

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

    gm(1000, 1000, config_theme.background)
        .fill(config_theme.font_color)
        .fontSize('46')
        // .font('baskvill.ttf')
        .out('-background', config_theme.background)
        .out('-kerning','1')
        .out('-gravity', 'west')
        .out('-size', '1000x', `caption:${text}`)
        .out('-composite')
        .out('-trim')
        .borderColor(config_theme.background)
        .border(20,20)
        .toBuffer('JPEG', cb);
};

module.exports = textToImage;
