const request = require('request');
const texttoimage = require('../tools/texttoimage');

const sendTextImage = (reverse_markup) =>{
    return (content,ctx,bot)=>{
        texttoimage(content, async (err,buffer)=>{
            if (err){
                console.log(err);
                return ctx.reply('Проблемы на сервере, скоро все исправим. Попробуйте еще раз.',null, reverse_markup)
            }
            const upload_data = await bot.execute('photos.getMessagesUploadServer');
            const formData = {
                photo: {
                    value: buffer,
                    options: {
                        filename: 'img_custom.jpg',
                        contentType: 'multipart/form-data'
                    }
                }
            };
            let boundary = '--------------------------';
            for (let i = 0; i < 24; i++) boundary += Math.floor(Math.random() * 10).toString(16);

            const options = {
                headers: {
                    'content-type': `multipart/form-data; boundary=${boundary}`,
                },
                uri: upload_data.upload_url,
                formData: formData,
                method: 'POST'
            };

            request(options, async (err, response, body) => {
                if (err) console.log('Request err: ', err);
                const photo_data = await bot.execute('photos.saveMessagesPhoto', JSON.parse(body));
                ctx.reply('',`photo${photo_data[0].owner_id}_${photo_data[0].id}`, reverse_markup)
            });
        });
    }
};

module.exports = sendTextImage;
