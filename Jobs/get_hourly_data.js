const mongoose = require('mongoose');
require('dotenv').config();
const axios = require('axios');
const moment = require('moment');
const HourlyMeasurementModel = require('../app/Models/AQDataHourly');

const {urls, lat_long_urls, data_files} = require('./cron_jobs_setup');
const get_hourly_data = async (test) => {
    try {
        let data = []
        // await mongoose.connect(process.env.MONGO_ATLAS_URL);
        if (test) {
            console.log('==============TEST HOURLY DATA============')
            for (let i = 0; i < data_files.length; i++) {
                //FETCH DATA FROM JSON FILES FOR TESTING
                const response = require(data_files[i].data);
                const lat_long_data = require(data_files[i].lat_long_data)
                const coordinates = lat_long_data.coordinates
                data.push(response)
                const name = data[i].name
                await saveData(name, data[i].historical.hourly, coordinates);
            }
        } else {
            for (let i = 0; i < data_files.length; i++) {
                //FETCH DATA FROM URL RUNS EVERY 48 hours
                const response = await axios.get(urls[i]);
                const lat_long_data = await axios.get(lat_long_urls[i]);
                const coordinates = lat_long_data.data.coordinates
                data.push(response.data);
                const name = data[i].name
                await saveData(name, data[i].historical.hourly, coordinates);
            }
        }
    } catch (error) {
        console.log('Error at getData: ', error);
    }
    // } finally {
    //     await mongoose.disconnect();
    // }
}

async function saveData(name, data, coordinates) {
    try {
        const timestamp = moment().format('YYYY-MM-DDTHH:mm:ssZ');
        console.log(timestamp)
        let times_saved = ""
        console.log(name)
        for (let i = 0; i < data.length; i++) {
            const newHourlyMeasurement = new HourlyMeasurementModel({
                cron_job_timestamp: timestamp,
                time_stamp: data[i].ts,
                particular_matter_1: data[i].pm1,
                particular_matter_10: {
                    aqi_us_ranking: data[i].pm10.aqius,
                    concentration: data[i].pm10.conc
                },
                particular_matter_25: {
                    aqi_us_ranking: data[i].pm25.aqius,
                    concentration: data[i].pm25.conc
                }, air_pressure: data[i].pr,
                humidity: data[i].hm,
                temperature: data[i].tp,
                name: name,
                latitude: coordinates.latitude,
                longitude: coordinates.longitude
            })
            try {
                await newHourlyMeasurement.save();
                times_saved += i + " "
            } catch (err) {
                console.log(err);
            }
        }
        console.log(times_saved);
    } catch (error) {
        console.log('Error at the start of saveData: ', error);
    }
}

// get_hourly_data(true)
module.exports = get_hourly_data



