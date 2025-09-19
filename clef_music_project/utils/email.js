const nodemailer = require('nodemailer');
require('dotenv').config();

const sendInquiryEmail = async (options) => {
    const transportOptions = process.env.EMAIL_SERVICE
        ? { service: process.env.EMAIL_SERVICE }
        : {
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: false,
        };

    const transporter = nodemailer.createTransport({
        ...transportOptions,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    // Check if this is a service request
    const isServiceRequest = options.serviceRequest;
    const subject = isServiceRequest 
        ? `New Service Request: ${options.productName}`
        : `New Product Inquiry: ${options.productName}`;

    const html = isServiceRequest ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                <h2 style="color: #333; margin: 0;">🔧 New Service Request</h2>
            </div>
            <div style="padding: 30px;">
                <p style="font-size: 16px; color: #555; line-height: 1.6;">You have received a new service request from a customer.</p>
                
                <h3 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Customer Details:</h3>
                <ul style="font-size: 16px; color: #555; line-height: 1.8;">
                    <li><strong>Name:</strong> ${options.userName}</li>
                    <li><strong>Email:</strong> ${options.userEmail}</li>
                    <li><strong>Phone:</strong> ${options.userPhone}</li>
                </ul>
                
                <h3 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Service Request Details:</h3>
                <ul style="font-size: 16px; color: #555; line-height: 1.8;">
                    <li><strong>User Type:</strong> ${options.serviceRequest.userType}</li>
                    <li><strong>Organ Part:</strong> ${options.serviceRequest.organPart}</li>
                    <li><strong>Organ Type:</strong> ${options.serviceRequest.organType}</li>
                    <li><strong>Serial Number:</strong> ${options.serviceRequest.serialNumber}</li>
                    <li><strong>Address:</strong> ${options.serviceRequest.address}</li>
                </ul>
                
                <div style="background-color: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #0066cc;"><strong>Action Required:</strong> Please contact the customer to schedule service appointment.</p>
                </div>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                <p>This is an automated service request notification. Please respond promptly to the customer.</p>
            </div>
        </div>
    ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                <h2 style="color: #333; margin: 0;">📦 New Product Inquiry</h2>
            </div>
            <div style="padding: 30px;">
                <p style="font-size: 16px; color: #555; line-height: 1.6;">You have received a new inquiry from a visitor.</p>
                
                <h3 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Visitor Details:</h3>
                <ul style="font-size: 16px; color: #555; line-height: 1.8;">
                    <li><strong>Name:</strong> ${options.userName}</li>
                    <li><strong>Email:</strong> ${options.userEmail}</li>
                    <li><strong>Phone:</strong> ${options.userPhone}</li>
                </ul>
                
                <h3 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Product Details:</h3>
                <ul style="font-size: 16px; color: #555; line-height: 1.8;">
                    <li><strong>Product Name:</strong> ${options.productName}</li>
                    <li><strong>Product ID:</strong> ${options.productId}</li>
                </ul>
                
                <div style="background-color: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #0066cc;"><strong>Action Required:</strong> Please contact the customer with product information.</p>
                </div>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                <p>This is an automated product inquiry notification. Please respond promptly to the customer.</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: process.env.GMAIL_USER || `Service Request System <noreply@ecommerce.com>`,
        to: process.env.UPSTREAM_TEAM_EMAIL,
        subject: subject,
        html: html,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ ${isServiceRequest ? 'Service request' : 'Product inquiry'} email sent to ${process.env.UPSTREAM_TEAM_EMAIL}`);
    } catch (err) {
        // Log and rethrow to let controller decide response
        console.error('Email send failed', err);
        throw err;
    }
};

const sendVisitorNotificationEmail = async (email, title, message) => {
    const transportOptions = process.env.EMAIL_SERVICE
        ? { service: process.env.EMAIL_SERVICE }
        : {
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: false,
        };

    const transporter = nodemailer.createTransport({
        ...transportOptions,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        logger: true,
    debug: true
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM || `E-commerce Notifications <noreply@ecommerce.com>`,
        to: email,
        subject: title,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                    <h2 style="color: #333; margin: 0;">Welcome to Our Website!</h2>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">Hello,</p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">${message}</p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">We're excited to have you visit our platform. Here are some highlights:</p>
                    <ul style="font-size: 16px; color: #555; line-height: 1.8;">
                        <li>Browse our latest products</li>
                        <li>Check out our special offers</li>
                        <li>Create an account for personalized experience</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Visit Our Website
                        </a>
                    </div>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">Thank you for choosing us!</p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">Best regards,<br>The Team</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                    <p>This is an automated notification. Please do not reply to this email.</p>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Visitor notification email sent to ${email}`);
    } catch (err) {
        console.error('Visitor notification email send failed', err);
        throw err;
    }
};

module.exports = { sendInquiryEmail, sendVisitorNotificationEmail };