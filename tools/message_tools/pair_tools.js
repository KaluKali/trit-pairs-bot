const textTableWeekday = (weekday_data, timetable) => {
    let i_pair = 1;
    let data_day_s = [];

    weekday_data.forEach((pair,i) => {
        if (i < 5){ // Pair limit
            if (pair.room === false) pair.room = '—';
            if (pair.name === false) pair.name = '—';
            data_day_s.push(
                [timetable[i_pair-1], pair.room.trim(), pair.name.trim().toLowerCase()],
                [timetable[i_pair], pair.room.trim(), pair.name.trim().toLowerCase()]
            );
            i_pair+=2;
        }
    });

    return data_day_s
}

module.exports = textTableWeekday
