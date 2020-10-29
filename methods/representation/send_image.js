const textToImage = require('../../tools/image_tools/txt_table_to_image');
const saveImageVK = require('../../tools/image_tools/save_image_into_vk');

const sendTextImage = (reverse_markup) => {
    return async (content, ctx, user_info)=>{
        textToImage(content, user_info ? user_info.theme : 0,(err,buffer)=>{
            if (err){
                console.error(`Error in method send_image:`);
                console.error(err);
                return ctx.reply('Проблемы на сервере, скоро все исправим. Попробуйте еще раз.',null, reverse_markup)
            }
            saveImageVK(buffer, ctx.bot, (photo_data) => {
                ctx.reply('', `photo${photo_data[0].owner_id}_${photo_data[0].id}`, reverse_markup)
            })
        });
    }
};

module.exports = sendTextImage;
