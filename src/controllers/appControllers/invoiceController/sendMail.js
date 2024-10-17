const fs = require('fs');
const custom = require('@/controllers/pdfController');
const { SendInvoice } = require('@/emailTemplate/SendEmailTemplate');
const mongoose = require('mongoose');
const InvoiceModel = mongoose.model('Invoice');
const { Resend } = require('resend');
const { loadSettings } = require('@/middlewares/settings');
const { useAppSettings } = require('@/settings');

const mail = async (req, res) => {
  try {
    const { id } = req.body;

    // Throw error if no id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ValidationError: Missing invoice ID',
      });
    }

    const result = await InvoiceModel.findOne({ _id: id, removed: false }).exec();

    // Throw error if no result
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'ValidationError: No invoice found',
      });
    }

    const { client } = result;
    const { name } = client;
    const email = client[client.type].email;

    if (!email) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'Client has no email, add a new email and try again',
      });
    }

    const modelName = 'Invoice';
    const fileId = modelName.toLowerCase() + '-' + result._id + '.pdf';
    const folderPath = modelName.toLowerCase();
    const targetLocation = `src/public/download/${folderPath}/${fileId}`;

    await custom.generatePdf(
      modelName,
      { filename: folderPath, format: 'A4', targetLocation },
      result,
      async () => {
        try {
          const sendResult = await sendViaApi({
            email,
            name,
            targetLocation,
          });

          if (sendResult && sendResult.id) {
            await InvoiceModel.findByIdAndUpdate({ _id: id, removed: false }, { status: 'sent' }).exec();

            return res.status(200).json({
              success: true,
              result: sendResult.id,
              message: `Successfully sent invoice to ${email}`,
            });
          } else {
            return res.status(500).json({
              success: false,
              result: null,
              message: 'Failed to send the invoice via email',
            });
          }
        } catch (error) {
          console.error('Error in sendViaApi:', error);
          return res.status(500).json({
            success: false,
            result: null,
            message: 'Error while sending invoice email',
          });
        }
      }
    );
  } catch (error) {
    console.error('Error in mail function:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


const sendViaApi = async ({ email, name, targetLocation }) => {
  try {
    const resend = new Resend(process.env.RESEND_API);

    const settings = await loadSettings();
    const idurar_app_email = 'noreply@jemsit.com';
    const idurar_app_company_email = settings['idurar_app_company_email'];
    const company_name = settings['company_name'];

    // Read and encode the file in base64
    const attachedFile = fs.readFileSync(targetLocation, { encoding: 'base64' });

    // Send the mail using the send method
    const response = await resend.emails.send({
      from: idurar_app_email,
      to: email,
      subject: 'Invoice From ' + company_name,
      reply_to: idurar_app_company_email,
      attachments: [
        {
          filename: 'Invoice.pdf',
          content: attachedFile,
          encoding: 'base64', // Ensure correct encoding
        },
      ],
      html: SendInvoice({ name, title: 'Invoice From ' + company_name }),
    });

    console.log('Full API response:', response); // Log the full response
    return response.data;
  } catch (error) {
    console.error('Error in sendViaApi:', error.response ? error.response.data : error.message);
    throw new Error('Error while sending email');
  }
};



module.exports = mail;
