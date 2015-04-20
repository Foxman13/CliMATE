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

#pragma once

#ifndef CONFIGURATION_H_
#define CONFIGURATION_H_

#include <ctime>
#include <sstream>
#include <iomanip>
#include <locale>
#include <string>
#include <vector>
#include "arduino.h"
#include "rapidxml.hpp"
#include "rapidxml_utils.hpp"

class Configuration
{
public:
	typedef struct 
	{
		std::wstring measure_name;
		std::wstring unit_of_measure;
		std::string sensor;
	} sensor_settings_t;

	typedef std::vector<sensor_settings_t> SensorsSettings;

	Configuration();
	virtual ~Configuration();

	void load(std::string const &filepath);

	std::string const &host() const;
	std::string const &user() const;
	std::string const &password() const;
	std::string const &eventHubName() const;
	std::string const &deviceName() const;
	std::wstring const &deviceNameW() const;
	std::string const &subject() const;
	std::wstring const &subjectW() const;
	std::string const &guid() const;
	std::wstring const &guidW() const;
	std::wstring const &location() const;
	std::wstring const &organization() const;
	bool amqpMessageTracking() const;
	SensorsSettings const &sensors() const;
	std::wstring getTimeNow() const;

private:
	std::string m_conv_buffer;
	std::string m_host;
	std::string m_user;
	std::string m_password;
	std::string m_event_hub_name;
	std::string m_device_name;
	std::wstring m_device_nameW;
	std::string m_subject;
	std::wstring m_subjectW;
	std::string m_guid;
	std::wstring m_guidW;
	std::wstring m_location;
	std::wstring m_organization;
	bool		m_amqp_message_tracking;
	SensorsSettings m_sensors;

	void _parseAppSettings(char* key, char* value);
	void _parseSensorSettings(char* key, char* value, sensor_settings_t& settings);
};

#endif // CONFIGURATION_H_