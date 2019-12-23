create database if not exists botdb;
use botdb;
create table if not exists users (id int(3) not null auto_increment primary key, time DATETIME,vk_id int, stud_group int(2), notification bool, notification_timetable_c bool,notification_timetable_y_d bool, additionally bool,additionally_2 bool);