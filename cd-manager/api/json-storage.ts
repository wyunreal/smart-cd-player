"use server";

import * as fs from "fs";

export const readJsonFromFile = <T>(filePath: string): T | null => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading JSON file:", error);
    return null;
  }
};

export const writeJsonToFile = <T>(filePath: string, data: T): void => {
  try {
    const jsonData = JSON.stringify(data);
    fs.writeFileSync(filePath, jsonData, "utf8");
  } catch (error) {
    console.error("Error writing JSON to file:", error);
  }
};
