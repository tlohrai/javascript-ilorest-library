'use strict';

/*
 *   (c) Copyright 2016 Hewlett Packard Enterprise Development LP

 *   Licensed under the Apache License, Version 2.0 (the "License"); you may
 *   not use this file except in compliance with the License. You may obtain
 *   a copy of the License at

 *        http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and limitations
 *   under the License.
 */

var MODULE = '../../dist';
var SERVER = process.env.SERVER; // 'https://10.10.10.10'
var USER   = process.env.USER;   // 'username'
var PASS   = process.env.PASS;   // 'pa55w0rd'

/*****	new user information ***************/
var new_ilo_loginname = 'name';
var new_ilo_username = 'username';
var new_ilo_password = 'password';
var irc = true;
var cfg = true;
var virtual_media = true;
var usercfg = true;
var vpr = true;
/******************************************/

var rest = require(MODULE);
var client = rest.redfishClient(SERVER);

console.log('Client initialized');

client.login(USER, PASS)
    .then((res) => {
        console.log('Login');
        return res;
    })
    .catch((err) => {
        console.log('\n  Login Failed\n');
        throw err;
    })

    .then(() => {
        var rdUrl = client.root.Oem.Hpe.Links.ResourceDirectory['@odata.id'];
        return client.get(rdUrl).catch((err) => {
            console.log('\n  Get ResourceDirectory Failed\n');
            throw err;
        });
    })

    .then((res) => {
        var uri, itemUri, itemType;
        for (let item of res.body.Instances) {
            itemType = item['@odata.type'];
            itemUri = item['@odata.id'];
            if(itemType && itemType.startsWith('#AccountService.')) {
                uri = itemUri;
            }
        }        
        if (!uri) { throw('ERROR: Type not found'); }

        return client.get(uri).catch((err) => {
            console.log('\n  Get Account Service Failed\n');
            throw err;
        });
    })

	.then((res) => {
		var body = {'UserName': new_ilo_loginname, 'Password': new_ilo_password, 'Oem': {}};
		body['Oem']['Hp'] = {};
		body['Oem']['Hp']['LoginName'] = new_ilo_username;
		body['Oem']['Hp']['Privileges'] = {};
		body['Oem']['Hp']['Privileges']['RemoteConsolePriv'] = irc;
		body['Oem']['Hp']['Privileges']['iLOConfigPriv'] = cfg;
		body['Oem']['Hp']['Privileges']['VirtualMediaPriv'] = virtual_media;
		body['Oem']['Hp']['Privileges']['UserConfigPriv'] = usercfg;
		body['Oem']['Hp']['Privileges']['VirtualPowerAndResetPriv'] = vpr;
		
		console.log('Post a new user account to ' + res.body['Accounts']['@odata.id']);

		return client.post(res.body['Accounts']['@odata.id'], body)
					.catch((err) => {
						console.log('\n  Add iLO User Account Failed\n');
						throw err;
					});
	})

    .catch((err) => {
        if (err.constructor.name === 'StatusCodeError') {
            console.log('\n' + err.error.error['@Message.ExtendedInfo'][0].MessageId + '\n');
        }
        else {
            console.log(err);
        }
    })

    .finally(() => {
        console.log('Logout');
        return client.logout();
    })
     .catch((err) => {
        console.log(err);
    });
