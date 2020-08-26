const texttoimage = require('../tools/texttoimage');
const saveImageVK = require('../tools/saveImageVK');

const sendTextImage = (reverse_markup) =>{
    return (content,ctx,bot)=>{
        texttoimage(content, async (err,buffer)=>{
            if (err){
                console.log(err);
                return ctx.reply('Проблемы на сервере, скоро все исправим. Попробуйте еще раз.',null, reverse_markup)
            }
            await saveImageVK(buffer, bot, (photo_data) => {
                ctx.reply('', `photo${photo_data[0].owner_id}_${photo_data[0].id}`, reverse_markup)
            })
        });
    }
};

module.exports = sendTextImage;
