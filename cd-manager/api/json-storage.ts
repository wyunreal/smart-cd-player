"use server";

import * as fs from "fs";

export const readJsonFromFile = async (filePath: string) => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Error reading JSON file: ${error}`);
  }
};

export const writeJsonToFile: (
  filePath: string,
  data: any
) => Promise<void> = async (filePath, data) =>
  new Promise((resolve, reject) => {
    try {
      const jsonData = JSON.stringify(data);
      fs.writeFileSync(filePath, jsonData, "utf8");
      resolve();
    } catch (error) {
      reject(new Error(`Error writing JSON to file: ${error}`));
    }
  });

export const fileExists = async (filePath: string) => fs.existsSync(filePath);
