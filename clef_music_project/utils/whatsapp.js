/*const twilio = require('twilio');

const sendWhatsAppMessage = async (to, body) => {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    try {
        await client.messages.create({
            body: body,
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:${to}`, // Make sure the 'to' number includes the country code
        });
        console.log(`WhatsApp message sent to ${to}`);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        // Depending on requirements, you might want to throw the error
        // to be handled by the controller.
    }
};

module.exports = sendWhatsAppMessage;*/


const twilio = require('twilio');

const sendWhatsAppMessage = async (to, message) => {
    const sid = process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    if (!sid || !token || !from) {
        throw new Error('Twilio configuration missing');
    }
    const client = twilio(sid, token);
    return client.messages.create({ from, to: `whatsapp:${to}`, body: message });
};

module.exports = sendWhatsAppMessage;
