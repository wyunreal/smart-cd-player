
import { PlayerCommand } from "../../api/types";
import { IrCommandSequenceItem } from "./client";

const getCommandForDigit = (digit: number) => PlayerCommand.Number0 + digit;

const getDigitCommandsSequenceForNumber = (number: number, delayAfterMs: number): IrCommandSequenceItem[] => {
  const sequence: IrCommandSequenceItem[] = [];
  const digits = number.toString().split("").map(d => parseInt(d));
  digits.forEach(digit => {
    sequence.push({ command: getCommandForDigit(digit), delayAfterMs });
  });
  return sequence;
}

export const getPlayTrackOrder = (trackNumber: number): IrCommandSequenceItem[] => {
  const sequence: IrCommandSequenceItem[] = [];
  sequence.push(...getDigitCommandsSequenceForNumber(trackNumber, 100));
  sequence.push({ command: PlayerCommand.Play, delayAfterMs: 0 });
  return sequence;
};

export const getSelectDiscOrder = (slotNumber: number): IrCommandSequenceItem[] => {
  const sequence: IrCommandSequenceItem[] = [];
  sequence.push({ command: PlayerCommand.DiskSelect, delayAfterMs: 100 });
  sequence.push(...getDigitCommandsSequenceForNumber(slotNumber, 100));
  sequence.push({command: PlayerCommand.Enter, delayAfterMs: 8000});
  return sequence;
};

export const getPlayDiscOrder = (slotNumber: number): IrCommandSequenceItem[] => {
  const sequence: IrCommandSequenceItem[] = [];
  sequence.push(...getSelectDiscOrder(slotNumber));
  sequence.push({ command: PlayerCommand.Play, delayAfterMs: 300 });
  return sequence;
};

export const getPlayTrackOnDiskOrder = (slotNumber: number, trackNumber: number): IrCommandSequenceItem[] => {
  const sequence: IrCommandSequenceItem[] = [];
  sequence.push(...getSelectDiscOrder(slotNumber));
  sequence.push(...getPlayTrackOrder(trackNumber));
  return sequence;
};