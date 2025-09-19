const pool = require('../config/db');
const { sendInquiryEmail } = require('../utils/email');

const createServiceRequest = async (req, res) => {
    const {
        user_type, organ_part, organ_type, serial_number,
        name, surname, country, street, house_number, postal_code,
        city, phone, email
    } = req.body;

    try {
        // 1️⃣ Save to database
        const result = await pool.query(
            `INSERT INTO service_requests
            (user_type, organ_part, organ_type, serial_number, name, surname, country, street, house_number, postal_code, city, phone, email)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            RETURNING *`,
            [user_type, organ_part, organ_type, serial_number, name, surname, country, street, house_number, postal_code, city, phone, email]
        );

        const newRequest = result.rows[0];

        // 2️⃣ Send emails
        try {
            // --- Send to company ---
            await sendInquiryEmail({
                userName: `${name} ${surname}`,
                userEmail: email,
                userPhone: phone,
                productName: `${organ_part} - ${organ_type}`,
                productId: serial_number,
                serviceRequest: {
                    userType: user_type,
                    organPart: organ_part,
                    organType: organ_type,
                    serialNumber: serial_number,
                    address: `${street}, ${house_number}, ${city}, ${postal_code}, ${country}`
                },
                recipient: process.env.UPSTREAM_TEAM_EMAIL // company email
            });
            console.log('✅ Service request email sent to company');

            // --- Send confirmation to user ---
            await sendInquiryEmail({
                userName: `${name} ${surname}`,
                userEmail: email,
                userPhone: phone,
                productName: `${organ_part} - ${organ_type}`,
                productId: serial_number,
                serviceRequest: {
                    userType: user_type,
                    organPart: organ_part,
                    organType: organ_type,
                    serialNumber: serial_number,
                    address: `${street}, ${house_number}, ${city}, ${postal_code}, ${country}`
                },
                recipient: email // customer email
            });
            console.log('✅ Confirmation email sent to customer');
        } catch (emailError) {
            console.error('❌ Service request email failed:', emailError);
            // Continue even if email fails
        }

        // 3️⃣ Send API response
        res.status(201).json({ message: 'Request submitted successfully', request: newRequest });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createServiceRequest };
