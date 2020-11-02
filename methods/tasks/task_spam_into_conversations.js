const send_image_changes = require('../representation/send_image_changes');
const send_text_changes = require('../representation/send_text_changes');
const saveImageIntoVk = require('../../tools/image_tools/save_image_into_vk');

async function task_mailing(bot, message, attachment) {
    let sending_params = {
        peer_id: 2000000000, // <- inside account id-dialog, DONT unique
        random_id: Math.floor(Math.random() * Math.floor(10000000000)),
    };
    if (message) sending_params.message = message;
    if (attachment) sending_params.attachment = attachment;

    const TOTAL_CONV = 2;

    for (let i = 1; i < TOTAL_CONV;i++){
        sending_params.peer_id+=1;
        await bot.execute('messages.send', sending_params)
            .then(()=>console.log(`task_mailing success ${sending_params.peer_id}`))
            .catch(error => console.error(`task_mailing error: ${error} conversation id: ${sending_params.peer_id}`));
    }
}

const task_spam_into_conversations = (reverse_markup, table_style, res) => {
    return async (data_changes, amount, bot) => {
        if (amount > 500) return task_mailing(bot, 'Выложено новое расписание!\nhttps://trit.biz/rr/');
        if (amount > 20) return task_mailing(bot, send_text_changes()(data_changes));

        send_image_changes()(data_changes, [], async (err, buffer)=>{
            if (err || !buffer){
                console.log(`toBuffer in spam_into_conversations.js error: ${err}`);
                await task_mailing(bot, 'Выложено новое расписание!\nhttps://trit.biz/rr/')
            } else {
                await saveImageIntoVk(buffer,bot,async (photo_data)=>{
                    await task_mailing(bot, 'Изменения в расписании:', `photo${photo_data[0].owner_id}_${photo_data[0].id}`);
                });
            }
        });
    }
};

module.exports = task_spam_into_conversations;
