"use server";

import * as fs from "fs";

export const readJsonFromFile = async <T>(
  filePath: string,
): Promise<T | null> => {
  const exists = fs.existsSync(filePath);
  console.log(`[DEBUG] Checking file: ${filePath}, exists: ${exists}`);

  if (!exists) {
    console.log(`[DEBUG] File checking returned false, returning null`);
    return null;
  }
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(
      `[DEBUG] Error reading file even though exists was true:`,
      error,
    );
    throw new Error(`Error reading JSON file: ${error}`);
  }
};

export const writeJsonToFile = async <T>(
  filePath: string,
  data: T,
): Promise<void> => {
  try {
    const jsonData = JSON.stringify(data);
    fs.writeFileSync(filePath, jsonData, "utf8");
  } catch (error) {
    throw new Error(`Error writing JSON to file: ${error}`);
  }
};

export const fileExists = async (filePath: string) => fs.existsSync(filePath);
