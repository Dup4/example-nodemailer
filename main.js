"use strict";

const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");
const { exit } = require("process");

function loadConfig() {
  const configPath = process.env.CONFIG_PATH ?? "./config.json";
  const fileData = fs.readFileSync(configPath, "utf8");
  return JSON.parse(fileData);
}

function loadData(file) {
  const data = fs.readFileSync(file, "utf8");
  return JSON.parse(data);
}

const config = loadConfig();

const { transportString, from, templatePath, dataPath } = config;

const transporter = nodemailer.createTransport(transportString);

async function sendEmail(to, templatePath, data) {
  const renderResult = (
    await ejs.renderFile(templatePath, {
      ...data,
    })
  ).trim();

  const [subject, ...contentLines] = renderResult.split("\n");
  const html = contentLines.join("\n");

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    return null;
  } catch (e) {
    return String(e);
  }
}

async function main() {
  const data = loadData(dataPath);

  for (const item of data) {
    const { name, email, username, password } = item;

    if (username.length > 0) {
      const err = await sendEmail(email, templatePath, {
        name,
        username,
        password,
      });

      if (err) {
        console.error(item, err);
      } else {
        console.log(item, "success");
      }
    }
  }

  exit(0);
}

main();
