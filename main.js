"use strict";

const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");
const dayjs = require("dayjs");
const { exit } = require("process");

function loadConfig() {
  const configPath = process.env.CONFIG_PATH ?? "./config.json";

  let config = {};

  if (fs.existsSync(configPath)) {
    const fileData = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(fileData);
  }

  if (!config.hasOwnProperty("transportString")) {
    config.transportString = process.env.TRANSPORT_STRING ?? "";
  }

  if (!config.hasOwnProperty("from")) {
    config.transportString = process.env.FROM ?? "";
  }

  if (!config.hasOwnProperty("templatePath")) {
    config.templatePath = process.env.TEMPLATE_PATH ?? "";
  }

  if (!config.hasOwnProperty("dataPath")) {
    config.dataPath = process.env.DATA_PATH ?? "";
  }

  return config;
}

function loadData(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

async function sendEmail(transporter, config, to, data) {
  const now = dayjs();

  const renderResult = (
    await ejs.renderFile(config.templatePath, {
      ...data,
      date: now.toISOString(),
    })
  ).trim();

  const [subject, ...contentLines] = renderResult.split("\n");
  const html = contentLines.join("\n");

  try {
    await transporter.sendMail({
      from: config.from,
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
  try {
    const config = loadConfig();

    console.log(config);

    const data = loadData(config.dataPath);

    const transporter = nodemailer.createTransport(config.transportString);

    for (const item of data) {
      if (!item.hasOwnProperty("email")) {
        continue;
      }

      const { email } = item;

      const err = await sendEmail(transporter, config, email, { ...item });
      if (err) {
        console.error(item, err);
      } else {
        console.log(item, "success");
      }
    }
  } catch (e) {
    console.error(String(e));
    exit(1);
  }

  exit(0);
}

main();
