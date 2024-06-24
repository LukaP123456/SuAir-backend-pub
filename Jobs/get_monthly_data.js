const mongoose = require('mongoose');
require('dotenv').config();
const moment = require('moment');
const MonthlyMeasurementModel = require('../app/Models/AQDataMonthly');
const axios = require("axios");

const {urls, lat_long_urls, data_files} = require('./cron_jobs_setup');
const get_monthly_data = async (test) => {
    try {
        let data = []
        // await mongoose.connect(process.env.MONGO_ATLAS_URL, {useUnifiedTopology: true});
        if (test) {
            console.log('==============TEST MONTHLY DATA============')
            for (let i = 0; i < data_files.length; i++) {
                //FETCH DATA FROM JSON FILES FOR TESTING
                const response = require(data_files[i].data);
                const lat_long_data = require(data_files[i].lat_long_data)
                const coordinates = lat_long_data.coordinates
                data.push(response)
                console.log(coordinates)
                const name = data[i].name
                await saveData(name, data[i].historical.monthly, coordinates);
            }
        } else {
            for (let i = 0; i < data_files.length; i++) {
                //FETCH DATA FROM URL Should run every 3 months
                const response = await axios.get(urls[i]);
                const lat_long_data = await axios.get(lat_long_urls[i]);
                const coordinates = lat_long_data.data.coordinates
                data.push(response.data);
                const name = data[i].name
                await saveData(name, data[i].historical.monthly, coordinates);
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
        let times_saved = ""
        console.log(name)
        for (let i = 0; i < data.length; i++) {
            const newDailyMeasurement = new MonthlyMeasurementModel({
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
                await newDailyMeasurement.save();
                times_saved += i + " "
                console.log(times_saved);
            } catch (err) {
                console.log(err);
            }
        }
        console.log(times_saved);
    } catch (error) {
        console.log('Error at the start of saveData: ', error);
    }
}

// get_monthly_data()
module.exports = get_monthly_data
