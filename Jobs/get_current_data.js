const mongoose = require('mongoose');
require('dotenv').config();
const moment = require('moment');
const CurrentMeasurementModel = require('../app/Models/AQCurrent');
const axios = require("axios");

const {urls, lat_long_urls, data_files} = require('./cron_jobs_setup');
const get_current_data = async (test) => {
    try {
        let data = []
        await mongoose.connect(process.env.MONGO_ATLAS_URL);
        let coordinates = []
        let name = ""
        // Delete all documents in the collection
        await CurrentMeasurementModel.deleteMany({});
        let times_saved = ""
        if (test) {
            console.log('==============TEST CURRENT DATA FETCHING============')
            for (let i = 0; i < data_files.length; i++) {
                //FETCH DATA FROM JSON FILES FOR TESTING
                const response = require(data_files[i].data);
                const lat_long_data = require(data_files[i].lat_long_data)
                coordinates = lat_long_data.coordinates
                data.push(response)
                name = data[i].name
                await saveData(name, data[i], coordinates);
                times_saved += i + " "
            }
            console.log(times_saved);
        } else {
            for (let i = 0; i < data_files.length; i++) {
                //FETCH DATA FROM URL Should run every hour days
                const response = await axios.get(urls[i]);
                const lat_long_data = await axios.get(lat_long_urls[i]);
                const coordinates = lat_long_data.data.coordinates
                data.push(response.data);
                const name = data[i].name
                await saveData(name, data[i], coordinates);
                times_saved += i + " "
            }
            console.log(times_saved);
        }
    } catch (error) {
        console.log('Error at getData: ', error);

    } finally {
        await mongoose.disconnect();
    }
}

async function saveData(name, data, coordinates) {
    try {
        const timestamp = moment().format('YYYY-MM-DDTHH:mm:ssZ');
        let times_saved = ""
        let i = 0;
        const newCurrentMeasurement = new CurrentMeasurementModel({
            cron_job_timestamp: timestamp,
            time_stamp: data.current.ts,
            particular_matter_1: data.current.pm1.conc,
            particular_matter_10: {
                aqi_us_ranking: data.current.pm10.aqius,
                concentration: data.current.pm10.conc
            },
            particular_matter_25: {
                aqi_us_ranking: data.current.pm25.aqius,
                concentration: data.current.pm25.conc
            }, air_pressure: data.current.pr,
            humidity: data.current.hm,
            temperature: data.current.tp,
            name: name,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
        })
        try {
            await newCurrentMeasurement.save();
        } catch (err) {
            console.log(err);
        }
    } catch (error) {
        console.log('Error at the start of saveData: ', error);
    }
}

// get_current_data()
module.exports = get_current_data