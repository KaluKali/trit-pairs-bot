const sendTextImage = () => {
    return (data_changes)=>{
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
        text_changes+='\nhttps://trit.biz/rr/';
        return text_changes;
    }
};

module.exports = sendTextImage;
