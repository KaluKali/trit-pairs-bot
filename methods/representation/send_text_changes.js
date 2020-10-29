const sendTextImage = () => {
    return async (data_changes, bot)=>{
        let text_changes = `Изменилось расписание:\n\n`;

        for (let one_day in data_changes){
            if (Object.keys(data_changes[one_day]).length){
                text_changes+=`${one_day} ${data_changes[one_day].date}: `;

                Object.keys(data_changes[one_day].changes).forEach(group=>{
                    text_changes += `гр. ${group}, `;
                });
                text_changes+='\n'
            }
        }
        for (let i = 1; i < process.env.TOTAL_CONVERSATION;i++){
            await bot.execute('messages.send', {
                peer_id: 2000000000+i, // <- inside account id-dialog, DONT unique
                random_id: Math.floor(Math.random() * Math.floor(10000000000)),
                message: text_changes,
            }).catch(error => console.error(`Main.js error: ${error}`));
        }
    }
};

module.exports = sendTextImage;
