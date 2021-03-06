const renderTableImage = require('./representation/render_table_image')
const saveImageVK = require('../tools/image_tools/save_image_into_vk')

const pairs_table = (reverse_markup, table_style, resources) => {
    return async (ctx) => {
        if (!ctx) return new Error('pairs_Day: Argument error');

        const [user_info] = await resources.db.userInfo(ctx.message.from_id, ['user_group','theme']);

        if (!user_info || !user_info.user_group) {
            return ctx.scene.enter('group');
        }

        let cache = resources.data.getCache(user_info.user_group,null,user_info.theme)

        if (cache) {
            ctx.reply('', cache, reverse_markup)
        } else {
            resources.data.getData(async (data, err) => {
                if (!err) {
                    renderTableImage(ctx, data[user_info.user_group+''],user_info.theme,(err,buffer)=>{
                        if (!err) {
                            saveImageVK(buffer, ctx.bot, (photo_data) => {
                                ctx.reply('', `photo${photo_data[0].owner_id}_${photo_data[0].id}`, reverse_markup)
                            })
                        } else {
                            console.trace(err)
                        }
                    });
                } else {
                    console.trace(err)
                }
            });
        }
    }
};

module.exports = pairs_table;
