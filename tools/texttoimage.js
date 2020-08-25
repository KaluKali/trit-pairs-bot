const gm = require('gm').subClass({imageMagick: true, appPath:'C:\\Program Files\\ImageMagick-7.0.10-Q16-HDRI\\'});

const texttoimage = (text, func) => {
    gm(800, 1000, '#FFFFFF')
        .fill('#000000')
        .fontSize('46')
        .font('./19809.otf')
        .out('-background', '#FFFFFF')
        .out('-kerning','1')
        .out('-size', '800x', `caption:${text}`, 'center')
        .out('-gravity', 'center')
        .out('-composite')
        .out('-trim')
        .borderColor('#FFFFFF')
        .border(20,20)
        .toBuffer('JPEG', func);
};

module.exports = texttoimage;
