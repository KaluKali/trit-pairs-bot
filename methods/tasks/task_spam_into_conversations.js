const renderImageChanges = require('../representation/render_image_changes');
const renderTextChanges = require('../representation/render_text_changes');
const saveImageIntoVk = require('../../tools/image_tools/save_image_into_vk');

async function task_mailing(bot, message, attachment) {
    const sending_params = {
        peer_id: 2000000000, // <- inside account id-dialog, DONT unique
        random_id: Math.floor(Math.random() * 10000000000),
        message,
        attachment,
    };
    // Для того, чтобы получить информацию о беседе с ключом доступа сообщества, у сообщества должны быть права администратора в беседе.
    // то есть без прав администратора информацию даже по getConversations не получить, однако слать сообщения можно
    const TOTAL_CONV = 13;

    for (let i = 1; i < TOTAL_CONV;i++){
        sending_params.peer_id+=1;
        await bot.execute('messages.send', sending_params)
            .then(()=>console.log(`task_mailing success ${sending_params.peer_id}`))
            .catch(error => console.error(`task_mailing error: ${error} conversation id: ${sending_params.peer_id}`));
    }
}

const task_spam_into_conversations = (reverse_markup, table_style, res) => {
    return async (data_changes, amount, bot) => {
        if (amount > 150) return task_mailing(bot, 'Выложено новое расписание!\nhttps://trit.biz/rr/');
        if (amount > 21) return task_mailing(bot, renderTextChanges()(data_changes));

        await renderImageChanges()(data_changes, [], async (err, buffer)=>{
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
