const dotenv = require('dotenv');
const crypt = require('crypto-js');
const jwt = require('jsonwebtoken');
const accountPool = require('../../config/accountDB.js');
const server = require('../../config/trainDB.js');
const crypto = require('../../utils.js');
const { query } = require('express');

dotenv.config();
const secret = process.env.secret;

const trainPool = server.trainPool ;
const trainPool2 = server.trainPool2 ;
//before payment transaction
const temporarySeatBooking = async (req, res) => {
    //authentication lagbe
    // req.body.user_name = 'X-33' ;
    // req.body.schedule_id = 1 ;
    // req.body.coach_name = 'AC_S' ;
    // req.body.booked_deatils = [[0,0,1,0],[0,1,1,0],[0,2,1,0]];
    // obj = req.body ;
    let obj = req.body ;

    console.log("Debug",obj)

    //transaction starting

    if(!obj.accesstoken) {
        return res.status(400).json({message: "Invalid token"});
    }

    jwt.verify(obj.accesstoken, secret, async (err, decodedToken) => {

        if(err) {
            console.log(err);
            return res.status(400).json({message: "Invalid token"});
        }


        //transaction starting
        try{
            trainPool.query('BEGIN') ;
            const query1 = {
                text : 'SELECT coach_id FROM "coach_info" WHERE coach_name = $1',
                values : [obj.coach_name]
            }
            let coach_id = (await trainPool.query(query1)).rows[0].coach_id;
        
            console.log(coach_id) ;
            console.log("temporarySeatBooking") ;
            console.log(obj) ;
            const dimension_query = {
                text : 'SELECT "train_details".dimensions,"train_details".coaches FROM "train_details" JOIN "train_schedule_info" ON "train_schedule_info".train_uid = "train_details".train_uid  WHERE schedule_id = $1',
                values : [obj.schedule_id]
            }

            let dimension = -1 ;
            let c_id = -1 ;
            console.log(dimension,c_id)
            let {dimensions,coaches} = (await trainPool.query(dimension_query)).rows[0] ;
            for (let i = 0 ; i < coaches.length ; i++) {
                console.log(coaches[i],coach_id) ;
                if(coaches[i] == coach_id) {
                    dimension = dimensions[i] ;
                    c_id = i+1 ;
                    break ;
                }
            }
            console.log(dimension,c_id)
            console.log(obj.booked_details.length,obj.booked_details)
            for(let i = 0 ; i < obj.booked_details.length ; i++) {
                //update two collumns
                // console.log(obj.booked_details)
                // let temp = obj.booked_details[i]
                // obj.booked_details[i][0] = obj.booked_details[i][2]*dimension[2] + obj.booked_details[i][0] 
                // console.log('row : ',obj.booked_details[i][0]) ;
                const query2 = {
                    text : 'UPDATE "train_schedule_info" SET seat_details[$1][$2][$3] = $4 WHERE schedule_id = $5',
                    values : [c_id,dimension[1]*(obj.booked_details[i][3]*dimension[2] + obj.booked_details[i][0] )+obj.booked_details[i][1]+1,3,1,obj.schedule_id]
                }
                await trainPool.query(query2) ;
            }
            // const query2 = {
            //     //colmns = schedule_id,ticket_id,user_id,seat_booked,seat_booked_string,start_details,end_details
            //     text : 'INSERT INTO "info" (schedule_id,username,seat_booked,seat_booked_string,details,coach_name) VALUES ($1,$2,$3,$4,$5,$6)',
            //     values : [obj.schedule_id,obj.user_name,obj.booked_details,obj.seat_booked_string,obj.details,obj.coach_name]
            // }
            // await trainPool.query(query2) ;
            await trainPool.query('COMMIT') ;
            res.status(200).json({message: "Seat Booked"}) ;


        }catch(err) {
            await trainPool.query('ROLLBACK') ;
            console.log(err) ;
            res.status(500).json({message: "Internal Server Error"}) ;
        }
    })

};

// const bookSuccess = async(req,res) => {
//     try{
//         //insert into the info table
//         const query1 = {
//             //colmns = schedule_id,ticket_id,user_id,seat_booked,seat_booked_string,start_details,end_details
//             text : 'INSERT INTO "info" (schedule_id,username,seat_booked,seat_booked_string,details,coach_name) VALUES ($1,$2,$3,$4,$5,$6,$7)',
//             values : [req.body.schedule_id,req.body.user_id,req.body.seat_booked,req.body.seat_booked_string,req.body.details,coach_name]
//         }
//         await trainPool.query(query1) ;

//     }catch(err) {

//     }
// }

const cancelBooking = async(req,res) => {
    let obj = req.body ;
    console.log(obj) ;
    if(!obj.accesstoken) {
        return res.status(400).json({message: "Invalid token"});
    }

    jwt.verify(obj.accesstoken, secret, async (err, decodedToken) => {

        if(err) {
            console.log(err);
            return res.status(400).json({message: "Invalid token"});
        }
        try{
            //at first find all the values from the info table
            const query0 = {
                text : 'SELECT * FROM "info" WHERE ticket_id = $1',
                values : [obj.ticket_id]
            }
            const data = (await trainPool.query(query0)).rows[0] ;
            console.log(data) ;

            //check if the cancel date in schedule info is bigger than today
            const checkQuery ={
                text : 'SELECT * from "train_schedule_info" WHERE schedule_id = $1 and cancel_deadline >= $2',
                values : [data.schedule_id,new Date()]
            }
            const check = (await trainPool.query(checkQuery)).rows[0] ;
            if(check.length == 0) {
                res.status(400).json({message: "Can't cancel the booking"}) ;
                return ;
            }
            //delete the entry from the info table using id
            const query1 = {
                text : 'DELETE FROM "info" WHERE ticket_id = $1',
                values : [obj.ticket_id]
            }
            await trainPool.query(query1) ;

            const query3 = {
                text : 'SELECT coach_id FROM "coach_info" WHERE coach_name = $1',
                values : [data.coach_name]
            }
            let coach_id = (await trainPool.query(query3)).rows[0].coach_id;
        
            console.log(coach_id) ;
            console.log("temporarySeatBooking") ;
            console.log(data) ;
            const dimension_query = {
                text : 'SELECT "train_details".dimensions,"train_details".coaches FROM "train_details" JOIN "train_schedule_info" ON "train_schedule_info".train_uid = "train_details".train_uid  WHERE schedule_id = $1',
                values : [data.schedule_id]
            }

            let dimension = -1 ;
            let c_id = -1 ;
            console.log(dimension,c_id)
            let {dimensions,coaches} = (await trainPool.query(dimension_query)).rows[0] ;
            for (let i = 0 ; i < coaches.length ; i++) {
                console.log(coaches[i],coach_id) ;
                if(coaches[i] == coach_id) {
                    dimension = dimensions[i] ;
                    c_id = i+1 ;
                    break ;
                }
            }
            console.log(dimension,c_id)
            // console.log(data.booked_details.length)
            for(let i = 0 ; i < data.seat_booked.length ; i++) {
                //update two collumns
                const query2 = {
                    text : 'UPDATE "train_schedule_info" SET seat_details[$1][$2][$3] = $4 WHERE schedule_id = $5',
                    values : [c_id,dimension[1]*(obj.booked_details[i][3]*dimension[2] + obj.booked_details[i][0] )+data.seat_booked[i][1]+1,3,0,data.schedule_id]
                }
                await trainPool.query(query2) ;
            }

            res.status(200).json({message: "Booking Cancelled"}) ;

            

            //update the seat_details of the schedule

        }catch(err){
            console.log(err) ;
            res.status(500).json({message: "Internal Server Error"}) ;

        }
    }) ;
}

const history = async (req,res) => {
    let obj = req.body ;
    console.log(obj) ;
    if(!obj.accesstoken) {
        return res.status(400).json({message: "Invalid token"});
    }

    jwt.verify(obj.accesstoken, secret, async (err, decodedToken) => {

        if(err) {
            console.log(err);
            return res.status(400).json({message: "Invalid token"});
        }
        try{
            const query1 = {
                text : 'SELECT * FROM "info" LEFT JOIN "train_schedule_info" ON info.schedule_id = train_schedule_info.schedule_id LEFT JOIN "train_services" ON train_schedule_info.train_id = train_services.train_id WHERE username = $1',
                values : [obj.user_name]
            }
            let data = (await trainPool.query(query1)).rows ;
            res.status(200).json(data) ;
        }catch(err){
            console.log(err) ;
            res.status(500).json({message: "Internal Server Error"}) ;
        }
    }) ;
}

module.exports = {
    temporarySeatBooking,cancelBooking,history
}

