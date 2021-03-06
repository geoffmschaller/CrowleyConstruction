const express = require('express');
const mailer = require('../mailer/mailer');
const sanitizer = require('../sanitizer/sanitizer');
const validator = require('../validators/contactValidator');
const contactModel = require('../models/contactModel');

const router = express.Router();

router.post('/new', async (req, res) => {

	// VALIDATE INPUT
	const valid_result = await validator(req.body);
	if (valid_result !== 200) return res.json(valid_result);

	// SANITIZE
	const cleanedInputs = {
		name: sanitizer(req.body.name),
		email: sanitizer(req.body.email),
		message: sanitizer(req.body.message)
	};

	// SEND TO DB
	new contactModel({...cleanedInputs}).save();

	// SEND EMAILS
	const ClientContactPayload = {
		from: {name: 'Crowley Construction', address: "mailer@crowleyconstructionid.com"},
		to: cleanedInputs.email,
		subject: "Message Received!",
		replyTo: "sean@crowleyconstructionid.com",
		template: {
			name: './mailer/views/outbound_contact.pug',
			engine: 'pug',
			context: {
				name: cleanedInputs.name,
				email: cleanedInputs.email,
				message: cleanedInputs.message,
				header: "We have received your message!"
			}
		}
	}

	const HouseContactPayload = {
		from: {name: 'Clementine', address: "mailer@crowleyconstructionid.com"},
		to: "sean@crowleyconstructionid.com",
		//to: "geoffmschaller@gmail.com",
		subject: "New Message Received!",
		replyTo: cleanedInputs.email,
		template: {
			name: './mailer/views/inbound_contact.pug',
			engine: 'pug',
			context: {
				name: cleanedInputs.name,
				email: cleanedInputs.email,
				message: cleanedInputs.message,
				header: "New message from website!"
			}
		}
	}

	await mailer(HouseContactPayload);
	await mailer(ClientContactPayload);

	res.json({errors: [], message: "Thank you! We have received your message!"});

});

module.exports = router;