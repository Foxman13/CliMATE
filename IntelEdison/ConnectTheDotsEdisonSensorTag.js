//  ---------------------------------------------------------------------------------
//  Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.
// 
//  The MIT License (MIT)
// 
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
// 
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
// 
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//  ---------------------------------------------------------------------------------

// We are using the Cylon library to access the hardware resources,'
// and take advantage of its convinient model for running tasks
var Cylon = require('cylon');

// Using HTTP Rest connection to Azure event Hubs
var https = require('https');
var http = require('http');
var crypto = require('crypto');
var moment = require('moment');

// Using a json settings file for Events Hub connectivity
var settings = require('./settings.json');
var SensorTag = require('./lib/sensortag');

// Keeping track of sensortag connectivity
var SensorTagConnected = false;
var DiscoveringSensorTag = false;

// ---------------------------------------------------------------
// Read settings from JSON file  passed as a parameter to the app
function readSettings(settings, options) {
    var missing = [];
    for (var idx in options) {
        if (settings[options[idx]] === undefined) missing.push(options[idx]);
    }
    if (missing.length > 0) {
        throw new Error('Required settings ' + (missing.join(', ')) + ' missing.');
    }
}

readSettings(settings, ['namespace', 'keyname', 'key', 'eventhubname', 'displayname', 'guid', 'organization', 'location']);

// ---------------------------------------------------------------
// Get the full Event Hub publisher URI
var my_uri = 'https://' + settings.namespace + '.servicebus.windows.net' + '/' + settings.eventhubname + '/publishers/' + settings.guid + '/messages';
    
// ---------------------------------------------------------------
// Create a SAS token
// See http://msdn.microsoft.com/library/azure/dn170477.aspx
function create_sas_token(uri, key_name, key) {
    // Token expires in one hour
    var expiry = moment().add(1, 'hours').unix();
    var string_to_sign = encodeURIComponent(uri) + '\n' + expiry;
    var hmac = crypto.createHmac('sha256', key);
    hmac.update(string_to_sign);
        
    var signature = hmac.digest('base64');
        
    var token = 'SharedAccessSignature sr=' + encodeURIComponent(uri) + '&sig=' + encodeURIComponent(signature) + '&se=' + expiry + '&skn=' + key_name;
        
    return token;

}
var my_sas = create_sas_token(my_uri, settings.keyname, settings.key);

// ---------------------------------------------------------------
// callback for SensorTag discovery
function onDiscover(sensorTag) {
    DiscoveringSensorTag = false;
    console.log('discovered: ' + sensorTag.uuid + ', type = ' + sensorTag.type);
    // Connect the the SensorTag
    sensorTag.connectAndSetUp(function (error) {
        if (error) {
            console.log('ConnectAndSetup Error:' + error);
            SensorTagConnected = false;
        } else {
            // SensorTag connected and setup
            SensorTagConnected = true;

            // Set "disconnect" callback
            sensorTag.on('disconnect', function () {
                console.log('Sensortag disconnected');
                SensorTagConnected = false;
            });

            // Enable IrTemperature sensor, setup 1s period and set callback to send AMQP message to Event Hubs
            sensorTag.enableIrTemperature(function (error) { if (error) console.log('enableIrTemperature ' + error); });
            sensorTag.setIrTemperaturePeriod(1000, function (error) { if (error) console.log('setIrTemperaturePeriod ' + error); });
            sensorTag.notifyIrTemperature(function (error) { if (error) console.log('notifyIrTemperature ' + error); });
            sensorTag.on('irTemperatureChange', function (objectTemperature, ambientTemperature) {
                var currentTime = new Date().toISOString();
                var irObjTemp = (objectTemperature.toFixed(1) * 9) / 5 + 32;
                send_message(format_sensor_data(settings.guid, settings.displayname, settings.organization, settings.location, "IRTemperature", "F", currentTime , irObjTemp), currentTime);
            });
            
            // Enable Humidity sensor, setup 1s period and set callback to send AMQP message to Event Hubs
            sensorTag.enableHumidity(function (error) { if (error) console.log('enableHumidity ' + error); });
            sensorTag.setHumidityPeriod(1000, function (error) { if (error) console.log('setHumidityPeriod ' + error); });
            sensorTag.notifyHumidity(function (error) { if (error) console.log('notifyHumidity ' + error); });
            sensorTag.on('humidityChange', function (temperature, humidity) {
                var currentTime = new Date().toISOString();
                var temp = (temperature.toFixed(1) * 9) / 5 + 32;
                var hmdt = humidity.toFixed(1);
                send_message(format_sensor_data(settings.guid, settings.displayname, settings.organization, settings.location, "Temperature", "F", currentTime , temp), currentTime);
                send_message(format_sensor_data(settings.guid, settings.displayname, settings.organization, settings.location, "Humidity", "%", currentTime , hmdt), currentTime);
            });
        }
    });
}

// ---------------------------------------------------------------
// Format sensor data into JSON
function format_sensor_data(guid, displayname, organization, location, measurename, unitofmeasure, timecreated, value) {
    var JSON_obj = {
        "guid": guid,
        "displayname": displayname,
        "organization": organization,
        "location": location,
        "measurename": measurename,
        "unitofmeasure": unitofmeasure,
        "timecreated": timecreated,
        "value": value
    };
    
    return JSON.stringify(JSON_obj);
}

// ---------------------------------------------------------------
// Send message to Event Hub
function send_message(message, time)
{
	console.log("Sending message: " + message);
    
    // Send the request to the Event Hub
    var http_options = {
            
        hostname: settings.namespace + '.servicebus.windows.net',
        port: 443,
        path: '/' + settings.eventhubname + '/publishers/' + settings.guid + '/messages',
        method: 'POST',
        headers: {
            'Authorization': my_sas,
            'Content-Length': message.length,
            'Content-Type': 'application/atom+xml;type=entry;charset=utf-8'
        }
    };
        
    var req = https.request(http_options, function (res) {
        console.log("statusCode: ", res.statusCode);
        console.log("headers: ", res.headers);
            
        res.on('data', function (d) {
            process.stdout.write(d);
        });
    });
        
    req.on('error', function (e) {
        console.error(e);
    });
        
    req.write(message);
        
    req.end();
}

var startbit = 0;
var ignitionstate = 0;
var startstate = 0;
var stopcranking = false;

function checkStart() {
    console.log("checkStart");
    var http_options = {
        host: 'archos.azurewebsites.net',
        path: '/delorean/CheckEngineStart'
    };
    
    var req = http.get(http_options, function (res) {
        console.log("getStart request finished");
        console.log("statusCode: ", res.statusCode);
        console.log("headers: ", res.headers);
        
        res.on('data', function (d) {
            console.log("data: " + d);
            startbit = parseInt(d);
        });

        req.on('error', function (e) {
            console.error(e);
        });
    });
}

function startCar() {
    //stopcranking = false;
    //var crankcount = 0;
    
    //crankbutton = setInterval(function () {
    //    console.log("reading tach voltage");
    //    var tachvoltage = my.tachsense.analogRead() * (5.0 / 1023.0);
    //    console.log("tach input: " + tachvoltage);
        
    //    if (tachvoltage > 2.0 || crankcount > 5) {
    //        // we need to stop cranking
    //        stopcranking = true;
    //        startstate = 0;
    //        crankcount = 0;
    //        console.log("Done cranking...");
    //        my.startrelay.digitalWrite(startstate);
    //        clearInterval(crankbutton);

    //    }
    //    else {
    //        if (!stopcranking) {
    //            startstate = 1;
    //            console.log("Cranking...");
    //            my.startrelay.digitalWrite(startstate);
    //            crankcount++;
    //        }
    //    }
    //}, 1000);   
}

// this robot actuates the relays based on state
Cylon.robot({
    connections: {
        edison: { adaptor: 'intel-iot' }
    },
    
    devices: {
        led: { driver: 'led', pin: 13 },
        ignitionbutton: { driver: 'button', pin: 3 },
        ignitionrelay: { driver: 'direct-pin', pin: 4 },
        startbutton: { driver: 'button', pin: 2 },
        startrelay: { driver: 'direct-pin', pin: 7 },
        tachsense: { driver: 'analog-sensor', pin: 2 }
    },
    work: function (my) {

        var starting = false;

        var crankbutton;
        // this is our query for starting
        every((3).second(), function () {
            checkStart();
            console.log("Start bit: " + startbit);

            if (startbit == 1 && !starting) {
                starting = true;
                stopcranking = false;
                var crankcount = 0;
                
                ignitionstate = 1;
                console.log("Igniton state: " + ignitionstate);
                my.ignitionrelay.digitalWrite(ignitionstate);
                
                setTimeout(function () {
                    console.log("wait 2 seconds before cranking");
                }, 2000);
                
                crankbutton = setInterval(function () {
                    console.log("reading tach voltage");
                    var tachvoltage = my.tachsense.analogRead() * (5.0 / 1023.0);
                    console.log("tach input: " + tachvoltage);
                    
                    if (tachvoltage > 2.0 || crankcount > 5) {
                        // we need to stop cranking
                        stopcranking = true;
                        startstate = 0;
                        crankcount = 0;
                        console.log("Done cranking...");
                        my.startrelay.digitalWrite(startstate);
                        clearInterval(crankbutton);
                        starting = false;
                        
                        if (ignitionstate == 1) {
                            ignitionstate = 0;
                            console.log("Igniton state: " + ignitionstate);
                            my.ignitionrelay.digitalWrite(ignitionstate);
                        }
                    }
                    else {
                        if (!stopcranking) {
                            startstate = 1;
                            console.log("Cranking...");
                            my.startrelay.digitalWrite(startstate);
                            crankcount++;
                        }
                    }
                }, 1000);
            }
        });

        

        
        my.ignitionbutton.on('push', function () {
            
            my.led.toggle();
            ignitionstate = 1 - ignitionstate;
            console.log("Igniton state: " + ignitionstate);
            my.ignitionrelay.digitalWrite(ignitionstate);
        });

        my.startbutton.on('push', function () {
            stopcranking = false;
            var crankcount = 0;
            
            crankbutton = setInterval(function () {
                console.log("reading tach voltage");
                var tachvoltage = my.tachsense.analogRead() * (5.0 / 1023.0);
                console.log("tach input: " + tachvoltage);
                
                if (tachvoltage > 2.0 || crankcount > 5) {
                    // we need to stop cranking
                    stopcranking = true;
                    startstate = 0;
                    crankcount = 0;
                    console.log("Done cranking...");
                    my.startrelay.digitalWrite(startstate);
                    clearInterval(crankbutton);

                }
                else {
                    if (!stopcranking) {
                        startstate = 1;
                        console.log("Cranking...");
                        my.startrelay.digitalWrite(startstate);
                        crankcount++;
                    }
                }
            }, 1000);
        });

        //my.startbutton.on('release', function () {
        //    startstate = 0;
        //    console.log("Done cranking...");
        //    my.startrelay.digitalWrite(startstate);
        //});
        
        

    }
}).start();

// ---------------------------------------------------------------
// This robot handles reading temperature and uploading the message to the event hub
Cylon.robot( {
    connections: {
        edison: { adaptor: 'intel-iot' }
    },
    
    devices: {
        sensor: { driver: 'analog-sensor', pin: 0 }
    },
    
    work: function (my) {
        var analogValue = 0;
        var B = 3975;

        // Regenerate the SAS token every hour
        every((3600000).second(), function () {
            my_sas = create_sas_token(my_uri, settings.keyname, settings.key);
        });
        
        // Every 15 seconds, upload the temperature to Azure
        every((15).second(), function () {     
            var currentTime = new Date().toISOString();
            analogValue = my.sensor.analogRead();
            var resistance = (1023 - analogValue) * 10000 / analogValue;
            var temp = 1 / (Math.log(resistance / 10000) / B + 1 / 298.15) - 273.15;
            //convert to Farenheit
            temp = (temp * 9) / 5 + 32;
            send_message(format_sensor_data(settings.guid, settings.displayname, settings.organization, settings.location, "Temperature", "F", currentTime , temp), currentTime);
        });
    }
}).start();


