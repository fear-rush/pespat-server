// IMPORT PACKAGES
import express from "express";
import easyinvoice from "easyinvoice";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import cors from "cors";
import bodyParser from "body-parser";
import "dotenv/config";
import qrcode from "qrcode";
import QR from "qrcode-base64";

const app = express();
let imgPath = path.resolve("img", "invoice.png");
function base64_encode(img) {
  let png = fs.readFileSync(img);
  return new Buffer.from(png).toString("base64");
}

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/send-invoice", async (req, res) => {
  const generateQrCode = async (data) => {
    try {
      const img = await qrcode.toDataURL(data);
      let base64result = img.split(",")[1];
      return base64result;
    } catch (err) {
      console.log(err);
      console.log("error disini banggg");
      return undefined;
    }
  };

  const generateQrBase64 = (data) => {
    const imgData = QR.drawImg(data, {
      typeNumber: 4,
      errorCorrectLevel: "M",
      size: 200,
    });
    let base64 = imgData.split(',')[1];
    console.log(`img data: ${base64}`);
    return base64;
  };

  const generateQr = (data) => {
    var qrCode = new QRCode();
  };
  // `${base64_encode(imgPath)}`
  let today = new Date();
  let date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

  let data = {
    settings: {
      currency: "IDR",
      taxNotation: "vat", //or gst
      marginTop: 25,
      marginRight: 25,
      marginLeft: 25,
      marginBottom: 25,
    },
    translate: {
      invoice: "RECEIPT",
      // "due-date": ""
    },
    images: {
      // logo: `${await generateQrCode(req.body.qrData)}`, //or base64
      logo: `${generateQrBase64(req.body.qrData)}`, //or base64
    },
    sender: {
      company: "PESPAT",
      address:
        "Jl. Grafika No.2, Yogyakarta, Senolowo, Sinduadi, Kec. Mlati, Kota Yogyakarta",
      zip: "55284",
      city: "Daerah Istimewa Yogyakarta",
      country: "Indonesia",
    },
    client: {
      company: req.body.username,
      address: req.body.address,
      zip: req.body.email,
      city: req.body.phoneNumber,
      country: "",
    },
    information: {
      number: req.body.paymentNumber,
      date: date,
    },
    invoiceDate: date,
    products: req.body.item.map((e) => ({
      quantity: e.count,
      description: `${e.title}, ${e.date}`,
      price: e.price,
      "tax-rate": 1,
    })),
    bottomNotice: "Terimakasih telah melakukan pembayaran.",
  };

  const invoicePdf = async () => {
    try {
      let result = await easyinvoice.createInvoice(data);
      let date = Date.now();
      fs.writeFileSync(`./invoice/invoice${date}.pdf`, result.pdf, "base64");
      let fileName = path.basename(`./invoice/invoice${date}.pdf`);
      console.log(fileName);
      if (fileName) {
        sendEmail(fileName);
      } else {
        console.log("file not found");
      }
    } catch (err) {
      console.log(`error di invoice ${JSON.stringify(err)}`);
    }
  };
  invoicePdf();

  const sendEmail = async (fileName) => {
    try {
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      let mailOptions = {
        from: "firasuchiha15@gmail.com",
        to: "fluffyfuffy1@gmail.com",
        subject: "test email",
        text: "test attachment",
        attachments: [
          {
            filename: fileName,
            path: `./invoice/${fileName}`,
          },
        ],
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log("error", err);
        } else {
          console.log("success");
        }
      });
    } catch (err) {
      console.log(`error di smtp ${err}`);
    }
  };
});

let PORT = process.env.PORT || 3301;

app.get("/", (req, res) => {
  res.json({
    message: `Build succeeded on port ${PORT}`,
  });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
