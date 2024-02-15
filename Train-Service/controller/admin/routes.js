const dotenv = require('dotenv');
const crypt = require('crypto-js');
const jwt = require('jsonwebtoken');
const accountPool = require('../../config/accountDB.js');
const server = require('../../config/trainDB.js');
const crypto = require('../../utils.js');
const { query } = require('express');


// console.log(server) ;
const trainPool = server.trainPool ;
const trainPool2 = server.trainPool2 ;

dotenv.config();
//token check hobe
const secret = process.env.secret;

function deleteHelper() {

}

// req.body  = [
//     {
//       "start": "Rajshahi",
//       "departure_time": "10:00:00",
//       "cost_class": [
//         100,
//         200,
//         350,
//         375
//       ]
//     },
//     {
//       "start": "NarayanGanj",
//       "departure_time": "11:00:00",
//       "cost_class": [
//         120,
//         220,
//         370,
//         400
//       ]
//     }
// ]


const addRoutes = async (req, res) => {
    try{
        let {error} = await trainPool2.from('routes_table')
                                          .insert(req.body) 
        if(error){
            throw error;
        }
        res.status(200).json({message: "Route added"});
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Internal Server Error"});
    }   
}

const updateRoutes = async (req, res) => {
    req.body.id = 1;
    req.body.routes = [
        {
          "start": "Rajshahi",
          "departure_time": "10:00:00",
          "cost_class": [
            100,
            200,
            350,
            375
          ]
        },
        {
          "start": "NarayanGanj",
          "departure_time": "11:00:00",
          "cost_class": [
            120,
            220,
            370,
            400
          ]
        }
    ]

    try{
        let {error} = await trainPool2.from('routes_table')
                                          .update({routes: req.body.routes}) 
                                          .eq('id', req.body.id)
        if(error){
            throw error;
        }
        res.status(200).json({message: "Route updated"});
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Internal Server Error"});
    }   
};

const deleteRoutes = async (req, res) => {
    try{
        let {error} = await trainPool2.from('routes_table')
                                          .delete()
                                          .eq('id', req.body.id)
        if(error){
            throw error;
        }
        res.status(200).json({message: "Route deleted"});
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Internal Server Error"});
    }   
}

module.exports = {
    updateRoutes,
    addRoutes,
    deleteRoutes

}


