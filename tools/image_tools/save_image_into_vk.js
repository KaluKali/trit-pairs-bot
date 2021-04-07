const request = require('request');

const saveImageIntoVk = async (buffer, bot, cb)=>{
    bot.execute('photos.getMessagesUploadServer')
        .then(upload_data=>{
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
                else bot.execute('photos.saveMessagesPhoto', JSON.parse(body)).then(cb).catch(err=>console.log('Save photo err',err))
            });
        },(err)=>console.log('Get url for upload error', err));
};

module.exports = saveImageIntoVk;
