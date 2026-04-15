import { useState, useMemo, useCallback, useRef } from "react";

// ─── PRICE LISTS ────────────────────────────────────────────────────────────
// PL-A: Amay's V3 granular prices ($/ct for polished)
const PL_A = {
  // Sieve Range → Color → Clarity → price
  // Format: "sieveKey|color|clarity" → $/ct
  // Sieve keys: 0.005-0.039, 0.04-0.079, 0.08-0.149, 0.15-0.179, 0.18-0.229, 0.23-0.349, 0.35-0.449, 0.45-0.549
  "0.005-0.039|D|IF": 850, "0.005-0.039|D|VVS1": 750, "0.005-0.039|D|VVS2": 650, "0.005-0.039|D|VS1": 550, "0.005-0.039|D|VS2": 475, "0.005-0.039|D|SI1": 375, "0.005-0.039|D|SI2": 300, "0.005-0.039|D|I1": 175,
  "0.005-0.039|E|IF": 800, "0.005-0.039|E|VVS1": 700, "0.005-0.039|E|VVS2": 600, "0.005-0.039|E|VS1": 525, "0.005-0.039|E|VS2": 450, "0.005-0.039|E|SI1": 350, "0.005-0.039|E|SI2": 275, "0.005-0.039|E|I1": 165,
  "0.005-0.039|F|IF": 750, "0.005-0.039|F|VVS1": 650, "0.005-0.039|F|VVS2": 575, "0.005-0.039|F|VS1": 500, "0.005-0.039|F|VS2": 425, "0.005-0.039|F|SI1": 325, "0.005-0.039|F|SI2": 260, "0.005-0.039|F|I1": 155,
  "0.005-0.039|G|IF": 650, "0.005-0.039|G|VVS1": 575, "0.005-0.039|G|VVS2": 500, "0.005-0.039|G|VS1": 425, "0.005-0.039|G|VS2": 375, "0.005-0.039|G|SI1": 300, "0.005-0.039|G|SI2": 240, "0.005-0.039|G|I1": 145,
  "0.005-0.039|H|IF": 575, "0.005-0.039|H|VVS1": 500, "0.005-0.039|H|VVS2": 450, "0.005-0.039|H|VS1": 375, "0.005-0.039|H|VS2": 325, "0.005-0.039|H|SI1": 275, "0.005-0.039|H|SI2": 220, "0.005-0.039|H|I1": 135,
  "0.005-0.039|I|IF": 475, "0.005-0.039|I|VVS1": 425, "0.005-0.039|I|VVS2": 375, "0.005-0.039|I|VS1": 325, "0.005-0.039|I|VS2": 275, "0.005-0.039|I|SI1": 240, "0.005-0.039|I|SI2": 195, "0.005-0.039|I|I1": 120,
  "0.005-0.039|J|IF": 400, "0.005-0.039|J|VVS1": 350, "0.005-0.039|J|VVS2": 300, "0.005-0.039|J|VS1": 275, "0.005-0.039|J|VS2": 240, "0.005-0.039|J|SI1": 210, "0.005-0.039|J|SI2": 170, "0.005-0.039|J|I1": 105,
  "0.005-0.039|K|IF": 325, "0.005-0.039|K|VVS1": 275, "0.005-0.039|K|VVS2": 250, "0.005-0.039|K|VS1": 225, "0.005-0.039|K|VS2": 200, "0.005-0.039|K|SI1": 175, "0.005-0.039|K|SI2": 145, "0.005-0.039|K|I1": 90,

  "0.04-0.079|D|IF": 1100, "0.04-0.079|D|VVS1": 950, "0.04-0.079|D|VVS2": 825, "0.04-0.079|D|VS1": 700, "0.04-0.079|D|VS2": 600, "0.04-0.079|D|SI1": 475, "0.04-0.079|D|SI2": 375, "0.04-0.079|D|I1": 225,
  "0.04-0.079|E|IF": 1050, "0.04-0.079|E|VVS1": 900, "0.04-0.079|E|VVS2": 775, "0.04-0.079|E|VS1": 675, "0.04-0.079|E|VS2": 575, "0.04-0.079|E|SI1": 450, "0.04-0.079|E|SI2": 350, "0.04-0.079|E|I1": 210,
  "0.04-0.079|F|IF": 975, "0.04-0.079|F|VVS1": 850, "0.04-0.079|F|VVS2": 725, "0.04-0.079|F|VS1": 625, "0.04-0.079|F|VS2": 550, "0.04-0.079|F|SI1": 425, "0.04-0.079|F|SI2": 325, "0.04-0.079|F|I1": 200,
  "0.04-0.079|G|IF": 850, "0.04-0.079|G|VVS1": 750, "0.04-0.079|G|VVS2": 650, "0.04-0.079|G|VS1": 550, "0.04-0.079|G|VS2": 475, "0.04-0.079|G|SI1": 375, "0.04-0.079|G|SI2": 300, "0.04-0.079|G|I1": 185,
  "0.04-0.079|H|IF": 750, "0.04-0.079|H|VVS1": 650, "0.04-0.079|H|VVS2": 575, "0.04-0.079|H|VS1": 475, "0.04-0.079|H|VS2": 425, "0.04-0.079|H|SI1": 350, "0.04-0.079|H|SI2": 275, "0.04-0.079|H|I1": 170,
  "0.04-0.079|I|IF": 625, "0.04-0.079|I|VVS1": 550, "0.04-0.079|I|VVS2": 475, "0.04-0.079|I|VS1": 425, "0.04-0.079|I|VS2": 375, "0.04-0.079|I|SI1": 300, "0.04-0.079|I|SI2": 250, "0.04-0.079|I|I1": 155,
  "0.04-0.079|J|IF": 525, "0.04-0.079|J|VVS1": 450, "0.04-0.079|J|VVS2": 400, "0.04-0.079|J|VS1": 350, "0.04-0.079|J|VS2": 300, "0.04-0.079|J|SI1": 260, "0.04-0.079|J|SI2": 215, "0.04-0.079|J|I1": 135,
  "0.04-0.079|K|IF": 425, "0.04-0.079|K|VVS1": 375, "0.04-0.079|K|VVS2": 325, "0.04-0.079|K|VS1": 275, "0.04-0.079|K|VS2": 250, "0.04-0.079|K|SI1": 225, "0.04-0.079|K|SI2": 185, "0.04-0.079|K|I1": 115,

  "0.08-0.149|D|IF": 1500, "0.08-0.149|D|VVS1": 1300, "0.08-0.149|D|VVS2": 1100, "0.08-0.149|D|VS1": 950, "0.08-0.149|D|VS2": 800, "0.08-0.149|D|SI1": 625, "0.08-0.149|D|SI2": 500, "0.08-0.149|D|I1": 300,
  "0.08-0.149|E|IF": 1400, "0.08-0.149|E|VVS1": 1200, "0.08-0.149|E|VVS2": 1050, "0.08-0.149|E|VS1": 900, "0.08-0.149|E|VS2": 750, "0.08-0.149|E|SI1": 600, "0.08-0.149|E|SI2": 475, "0.08-0.149|E|I1": 285,
  "0.08-0.149|F|IF": 1300, "0.08-0.149|F|VVS1": 1100, "0.08-0.149|F|VVS2": 975, "0.08-0.149|F|VS1": 825, "0.08-0.149|F|VS2": 700, "0.08-0.149|F|SI1": 550, "0.08-0.149|F|SI2": 450, "0.08-0.149|F|I1": 270,
  "0.08-0.149|G|IF": 1100, "0.08-0.149|G|VVS1": 975, "0.08-0.149|G|VVS2": 850, "0.08-0.149|G|VS1": 725, "0.08-0.149|G|VS2": 625, "0.08-0.149|G|SI1": 500, "0.08-0.149|G|SI2": 400, "0.08-0.149|G|I1": 250,
  "0.08-0.149|H|IF": 975, "0.08-0.149|H|VVS1": 850, "0.08-0.149|H|VVS2": 750, "0.08-0.149|H|VS1": 625, "0.08-0.149|H|VS2": 550, "0.08-0.149|H|SI1": 450, "0.08-0.149|H|SI2": 375, "0.08-0.149|H|I1": 230,
  "0.08-0.149|I|IF": 825, "0.08-0.149|I|VVS1": 725, "0.08-0.149|I|VVS2": 625, "0.08-0.149|I|VS1": 550, "0.08-0.149|I|VS2": 475, "0.08-0.149|I|SI1": 400, "0.08-0.149|I|SI2": 325, "0.08-0.149|I|I1": 200,
  "0.08-0.149|J|IF": 700, "0.08-0.149|J|VVS1": 600, "0.08-0.149|J|VVS2": 525, "0.08-0.149|J|VS1": 450, "0.08-0.149|J|VS2": 400, "0.08-0.149|J|SI1": 350, "0.08-0.149|J|SI2": 275, "0.08-0.149|J|I1": 175,
  "0.08-0.149|K|IF": 575, "0.08-0.149|K|VVS1": 500, "0.08-0.149|K|VVS2": 425, "0.08-0.149|K|VS1": 375, "0.08-0.149|K|VS2": 325, "0.08-0.149|K|SI1": 275, "0.08-0.149|K|SI2": 230, "0.08-0.149|K|I1": 150,

  "0.15-0.179|D|IF": 2000, "0.15-0.179|D|VVS1": 1750, "0.15-0.179|D|VVS2": 1500, "0.15-0.179|D|VS1": 1250, "0.15-0.179|D|VS2": 1050, "0.15-0.179|D|SI1": 825, "0.15-0.179|D|SI2": 650, "0.15-0.179|D|I1": 400,
  "0.15-0.179|E|IF": 1900, "0.15-0.179|E|VVS1": 1650, "0.15-0.179|E|VVS2": 1400, "0.15-0.179|E|VS1": 1175, "0.15-0.179|E|VS2": 1000, "0.15-0.179|E|SI1": 775, "0.15-0.179|E|SI2": 625, "0.15-0.179|E|I1": 375,
  "0.15-0.179|F|IF": 1750, "0.15-0.179|F|VVS1": 1500, "0.15-0.179|F|VVS2": 1300, "0.15-0.179|F|VS1": 1100, "0.15-0.179|F|VS2": 925, "0.15-0.179|F|SI1": 725, "0.15-0.179|F|SI2": 575, "0.15-0.179|F|I1": 350,
  "0.15-0.179|G|IF": 1500, "0.15-0.179|G|VVS1": 1300, "0.15-0.179|G|VVS2": 1100, "0.15-0.179|G|VS1": 950, "0.15-0.179|G|VS2": 800, "0.15-0.179|G|SI1": 650, "0.15-0.179|G|SI2": 525, "0.15-0.179|G|I1": 325,
  "0.15-0.179|H|IF": 1300, "0.15-0.179|H|VVS1": 1100, "0.15-0.179|H|VVS2": 975, "0.15-0.179|H|VS1": 825, "0.15-0.179|H|VS2": 700, "0.15-0.179|H|SI1": 575, "0.15-0.179|H|SI2": 475, "0.15-0.179|H|I1": 300,
  "0.15-0.179|I|IF": 1100, "0.15-0.179|I|VVS1": 950, "0.15-0.179|I|VVS2": 825, "0.15-0.179|I|VS1": 700, "0.15-0.179|I|VS2": 600, "0.15-0.179|I|SI1": 500, "0.15-0.179|I|SI2": 425, "0.15-0.179|I|I1": 260,
  "0.15-0.179|J|IF": 925, "0.15-0.179|J|VVS1": 800, "0.15-0.179|J|VVS2": 700, "0.15-0.179|J|VS1": 600, "0.15-0.179|J|VS2": 500, "0.15-0.179|J|SI1": 425, "0.15-0.179|J|SI2": 350, "0.15-0.179|J|I1": 225,
  "0.15-0.179|K|IF": 750, "0.15-0.179|K|VVS1": 650, "0.15-0.179|K|VVS2": 575, "0.15-0.179|K|VS1": 500, "0.15-0.179|K|VS2": 425, "0.15-0.179|K|SI1": 350, "0.15-0.179|K|SI2": 300, "0.15-0.179|K|I1": 195,

  "0.18-0.229|D|IF": 2400, "0.18-0.229|D|VVS1": 2100, "0.18-0.229|D|VVS2": 1800, "0.18-0.229|D|VS1": 1500, "0.18-0.229|D|VS2": 1250, "0.18-0.229|D|SI1": 975, "0.18-0.229|D|SI2": 775, "0.18-0.229|D|I1": 475,
  "0.18-0.229|E|IF": 2250, "0.18-0.229|E|VVS1": 1950, "0.18-0.229|E|VVS2": 1700, "0.18-0.229|E|VS1": 1400, "0.18-0.229|E|VS2": 1175, "0.18-0.229|E|SI1": 925, "0.18-0.229|E|SI2": 725, "0.18-0.229|E|I1": 450,
  "0.18-0.229|F|IF": 2100, "0.18-0.229|F|VVS1": 1800, "0.18-0.229|F|VVS2": 1550, "0.18-0.229|F|VS1": 1300, "0.18-0.229|F|VS2": 1100, "0.18-0.229|F|SI1": 850, "0.18-0.229|F|SI2": 675, "0.18-0.229|F|I1": 425,
  "0.18-0.229|G|IF": 1800, "0.18-0.229|G|VVS1": 1550, "0.18-0.229|G|VVS2": 1350, "0.18-0.229|G|VS1": 1125, "0.18-0.229|G|VS2": 950, "0.18-0.229|G|SI1": 775, "0.18-0.229|G|SI2": 625, "0.18-0.229|G|I1": 400,
  "0.18-0.229|H|IF": 1550, "0.18-0.229|H|VVS1": 1350, "0.18-0.229|H|VVS2": 1175, "0.18-0.229|H|VS1": 975, "0.18-0.229|H|VS2": 825, "0.18-0.229|H|SI1": 675, "0.18-0.229|H|SI2": 550, "0.18-0.229|H|I1": 350,
  "0.18-0.229|I|IF": 1300, "0.18-0.229|I|VVS1": 1100, "0.18-0.229|I|VVS2": 975, "0.18-0.229|I|VS1": 825, "0.18-0.229|I|VS2": 700, "0.18-0.229|I|SI1": 575, "0.18-0.229|I|SI2": 475, "0.18-0.229|I|I1": 300,
  "0.18-0.229|J|IF": 1100, "0.18-0.229|J|VVS1": 950, "0.18-0.229|J|VVS2": 825, "0.18-0.229|J|VS1": 700, "0.18-0.229|J|VS2": 600, "0.18-0.229|J|SI1": 500, "0.18-0.229|J|SI2": 425, "0.18-0.229|J|I1": 265,
  "0.18-0.229|K|IF": 900, "0.18-0.229|K|VVS1": 775, "0.18-0.229|K|VVS2": 675, "0.18-0.229|K|VS1": 575, "0.18-0.229|K|VS2": 500, "0.18-0.229|K|SI1": 425, "0.18-0.229|K|SI2": 350, "0.18-0.229|K|I1": 225,

  "0.23-0.349|D|IF": 3200, "0.23-0.349|D|VVS1": 2800, "0.23-0.349|D|VVS2": 2400, "0.23-0.349|D|VS1": 2000, "0.23-0.349|D|VS2": 1700, "0.23-0.349|D|SI1": 1300, "0.23-0.349|D|SI2": 1025, "0.23-0.349|D|I1": 625,
  "0.23-0.349|E|IF": 3000, "0.23-0.349|E|VVS1": 2600, "0.23-0.349|E|VVS2": 2250, "0.23-0.349|E|VS1": 1875, "0.23-0.349|E|VS2": 1575, "0.23-0.349|E|SI1": 1225, "0.23-0.349|E|SI2": 975, "0.23-0.349|E|I1": 600,
  "0.23-0.349|F|IF": 2800, "0.23-0.349|F|VVS1": 2400, "0.23-0.349|F|VVS2": 2050, "0.23-0.349|F|VS1": 1725, "0.23-0.349|F|VS2": 1450, "0.23-0.349|F|SI1": 1125, "0.23-0.349|F|SI2": 900, "0.23-0.349|F|I1": 550,
  "0.23-0.349|G|IF": 2400, "0.23-0.349|G|VVS1": 2100, "0.23-0.349|G|VVS2": 1800, "0.23-0.349|G|VS1": 1500, "0.23-0.349|G|VS2": 1275, "0.23-0.349|G|SI1": 1000, "0.23-0.349|G|SI2": 800, "0.23-0.349|G|I1": 500,
  "0.23-0.349|H|IF": 2050, "0.23-0.349|H|VVS1": 1800, "0.23-0.349|H|VVS2": 1550, "0.23-0.349|H|VS1": 1300, "0.23-0.349|H|VS2": 1100, "0.23-0.349|H|SI1": 875, "0.23-0.349|H|SI2": 725, "0.23-0.349|H|I1": 450,
  "0.23-0.349|I|IF": 1725, "0.23-0.349|I|VVS1": 1475, "0.23-0.349|I|VVS2": 1300, "0.23-0.349|I|VS1": 1100, "0.23-0.349|I|VS2": 925, "0.23-0.349|I|SI1": 750, "0.23-0.349|I|SI2": 625, "0.23-0.349|I|I1": 400,
  "0.23-0.349|J|IF": 1450, "0.23-0.349|J|VVS1": 1250, "0.23-0.349|J|VVS2": 1075, "0.23-0.349|J|VS1": 925, "0.23-0.349|J|VS2": 775, "0.23-0.349|J|SI1": 650, "0.23-0.349|J|SI2": 525, "0.23-0.349|J|I1": 350,
  "0.23-0.349|K|IF": 1175, "0.23-0.349|K|VVS1": 1025, "0.23-0.349|K|VVS2": 875, "0.23-0.349|K|VS1": 750, "0.23-0.349|K|VS2": 650, "0.23-0.349|K|SI1": 550, "0.23-0.349|K|SI2": 450, "0.23-0.349|K|I1": 300,

  "0.35-0.449|D|IF": 4200, "0.35-0.449|D|VVS1": 3600, "0.35-0.449|D|VVS2": 3100, "0.35-0.449|D|VS1": 2600, "0.35-0.449|D|VS2": 2200, "0.35-0.449|D|SI1": 1700, "0.35-0.449|D|SI2": 1350, "0.35-0.449|D|I1": 825,
  "0.35-0.449|E|IF": 3900, "0.35-0.449|E|VVS1": 3400, "0.35-0.449|E|VVS2": 2900, "0.35-0.449|E|VS1": 2450, "0.35-0.449|E|VS2": 2050, "0.35-0.449|E|SI1": 1600, "0.35-0.449|E|SI2": 1275, "0.35-0.449|E|I1": 775,
  "0.35-0.449|F|IF": 3600, "0.35-0.449|F|VVS1": 3100, "0.35-0.449|F|VVS2": 2700, "0.35-0.449|F|VS1": 2250, "0.35-0.449|F|VS2": 1900, "0.35-0.449|F|SI1": 1475, "0.35-0.449|F|SI2": 1175, "0.35-0.449|F|I1": 725,
  "0.35-0.449|G|IF": 3100, "0.35-0.449|G|VVS1": 2700, "0.35-0.449|G|VVS2": 2300, "0.35-0.449|G|VS1": 1950, "0.35-0.449|G|VS2": 1650, "0.35-0.449|G|SI1": 1300, "0.35-0.449|G|SI2": 1050, "0.35-0.449|G|I1": 650,
  "0.35-0.449|H|IF": 2700, "0.35-0.449|H|VVS1": 2350, "0.35-0.449|H|VVS2": 2025, "0.35-0.449|H|VS1": 1700, "0.35-0.449|H|VS2": 1450, "0.35-0.449|H|SI1": 1150, "0.35-0.449|H|SI2": 925, "0.35-0.449|H|I1": 575,
  "0.35-0.449|I|IF": 2250, "0.35-0.449|I|VVS1": 1950, "0.35-0.449|I|VVS2": 1700, "0.35-0.449|I|VS1": 1425, "0.35-0.449|I|VS2": 1200, "0.35-0.449|I|SI1": 975, "0.35-0.449|I|SI2": 800, "0.35-0.449|I|I1": 500,
  "0.35-0.449|J|IF": 1900, "0.35-0.449|J|VVS1": 1650, "0.35-0.449|J|VVS2": 1425, "0.35-0.449|J|VS1": 1200, "0.35-0.449|J|VS2": 1025, "0.35-0.449|J|SI1": 825, "0.35-0.449|J|SI2": 675, "0.35-0.449|J|I1": 425,
  "0.35-0.449|K|IF": 1550, "0.35-0.449|K|VVS1": 1350, "0.35-0.449|K|VVS2": 1150, "0.35-0.449|K|VS1": 975, "0.35-0.449|K|VS2": 850, "0.35-0.449|K|SI1": 700, "0.35-0.449|K|SI2": 575, "0.35-0.449|K|I1": 375,

  "0.45-0.549|D|IF": 5500, "0.45-0.549|D|VVS1": 4750, "0.45-0.549|D|VVS2": 4100, "0.45-0.549|D|VS1": 3400, "0.45-0.549|D|VS2": 2850, "0.45-0.549|D|SI1": 2200, "0.45-0.549|D|SI2": 1750, "0.45-0.549|D|I1": 1075,
  "0.45-0.549|E|IF": 5100, "0.45-0.549|E|VVS1": 4400, "0.45-0.549|E|VVS2": 3800, "0.45-0.549|E|VS1": 3200, "0.45-0.549|E|VS2": 2675, "0.45-0.549|E|SI1": 2075, "0.45-0.549|E|SI2": 1650, "0.45-0.549|E|I1": 1000,
  "0.45-0.549|F|IF": 4700, "0.45-0.549|F|VVS1": 4050, "0.45-0.549|F|VVS2": 3500, "0.45-0.549|F|VS1": 2950, "0.45-0.549|F|VS2": 2475, "0.45-0.549|F|SI1": 1925, "0.45-0.549|F|SI2": 1525, "0.45-0.549|F|I1": 925,
  "0.45-0.549|G|IF": 4050, "0.45-0.549|G|VVS1": 3500, "0.45-0.549|G|VVS2": 3000, "0.45-0.549|G|VS1": 2500, "0.45-0.549|G|VS2": 2125, "0.45-0.549|G|SI1": 1675, "0.45-0.549|G|SI2": 1350, "0.45-0.549|G|I1": 825,
  "0.45-0.549|H|IF": 3500, "0.45-0.549|H|VVS1": 3025, "0.45-0.549|H|VVS2": 2625, "0.45-0.549|H|VS1": 2200, "0.45-0.549|H|VS2": 1875, "0.45-0.549|H|SI1": 1475, "0.45-0.549|H|SI2": 1200, "0.45-0.549|H|I1": 750,
  "0.45-0.549|I|IF": 2900, "0.45-0.549|I|VVS1": 2500, "0.45-0.549|I|VVS2": 2175, "0.45-0.549|I|VS1": 1825, "0.45-0.549|I|VS2": 1550, "0.45-0.549|I|SI1": 1250, "0.45-0.549|I|SI2": 1025, "0.45-0.549|I|I1": 650,
  "0.45-0.549|J|IF": 2450, "0.45-0.549|J|VVS1": 2100, "0.45-0.549|J|VVS2": 1825, "0.45-0.549|J|VS1": 1525, "0.45-0.549|J|VS2": 1300, "0.45-0.549|J|SI1": 1050, "0.45-0.549|J|SI2": 875, "0.45-0.549|J|I1": 550,
  "0.45-0.549|K|IF": 2000, "0.45-0.549|K|VVS1": 1725, "0.45-0.549|K|VVS2": 1500, "0.45-0.549|K|VS1": 1275, "0.45-0.549|K|VS2": 1075, "0.45-0.549|K|SI1": 875, "0.45-0.549|K|SI2": 725, "0.45-0.549|K|I1": 475,
};

// Helper: Generate PL-M from PL-A (market broker avg + 20% + 15% flat)
function getPLM(sieveKey, color, clarity) {
  const key = `${sieveKey}|${color}|${clarity}`;
  const plaPrice = PL_A[key];
  if (!plaPrice) return null;
  return Math.round(plaPrice * 1.20 * 1.15);
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const SIEVE_RANGES = [
  { key: "0.005-0.039", label: "0.005–0.039 ct", avgPolCt: 0.022 },
  { key: "0.04-0.079", label: "0.04–0.079 ct", avgPolCt: 0.06 },
  { key: "0.08-0.149", label: "0.08–0.149 ct", avgPolCt: 0.115 },
  { key: "0.15-0.179", label: "0.15–0.179 ct", avgPolCt: 0.165 },
  { key: "0.18-0.229", label: "0.18–0.229 ct", avgPolCt: 0.205 },
  { key: "0.23-0.349", label: "0.23–0.349 ct", avgPolCt: 0.29 },
  { key: "0.35-0.449", label: "0.35–0.449 ct", avgPolCt: 0.40 },
  { key: "0.45-0.549", label: "0.45–0.549 ct", avgPolCt: 0.50 },
];

const COLORS = ["D","E","F","G","H","I","J","K"];
const CLARITIES = ["IF","VVS1","VVS2","VS1","VS2","SI1","SI2","I1"];
const SHAPES = ["Round","Princess","Oval","Marquise","Pear","Cushion","Emerald"];

// Fluorescence discounts (fixed)
const FLUOR_DISCOUNTS = { None: 0, Faint: 0, Medium: 0.25, Strong: 0.25 };

// Manufacture vs sell: only D-H × VVS1-VS2; sell-off at 70%
const MFG_COLORS = ["D","E","F","G","H"];
const MFG_CLARITIES = ["IF","VVS1","VVS2","VS1","VS2"];

function shouldManufacture(color, clarity) {
  return MFG_COLORS.includes(color) && MFG_CLARITIES.includes(clarity);
}

// Hot bands by MM diameter
const HOT_BANDS = [
  { name: "Band 1", min: 1.30, max: 1.39 },
  { name: "Band 2", min: 1.90, max: 1.99 },
  { name: "Band 3a", min: 2.60, max: 2.79 },
  { name: "Band 3b", min: 3.20, max: 3.59 },
];

// Approx MM diameter from polish ct (round brilliant)
function ctToMM(ct) {
  return 6.43 * Math.pow(ct, 1/3);
}

function getHotBand(polishCt) {
  const mm = ctToMM(polishCt);
  return HOT_BANDS.find(b => mm >= b.min && mm <= b.max) || null;
}

// ─── ID Generator ───────────────────────────────────────────────────────────
let _id = 0;
const nextId = () => ++_id;

// ─── STYLES ─────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg: #0a0e17;
  --surface: #111827;
  --surface2: #1a2234;
  --border: #1e293b;
  --border-bright: #334155;
  --text: #e2e8f0;
  --text-dim: #94a3b8;
  --text-muted: #64748b;
  --accent: #38bdf8;
  --accent-dim: rgba(56,189,248,0.15);
  --green: #34d399;
  --green-dim: rgba(52,211,153,0.15);
  --red: #f87171;
  --red-dim: rgba(248,113,113,0.15);
  --amber: #fbbf24;
  --amber-dim: rgba(251,191,36,0.15);
  --purple: #a78bfa;
  --purple-dim: rgba(167,139,250,0.15);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.header-icon {
  width: 48px; height: 48px;
  background: linear-gradient(135deg, var(--accent), #818cf8);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.header h1 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.header p {
  font-size: 13px;
  color: var(--text-dim);
  margin-top: 2px;
}

/* ── SECTIONS ── */
.section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title .dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--accent);
}

/* ── FORM GRID ── */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.field label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.field input, .field select {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.field input:focus, .field select:focus {
  border-color: var(--accent);
}

.field input::placeholder { color: var(--text-muted); }

/* ── LINES TABLE ── */
.lines-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.lines-table th {
  text-align: left;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.lines-table td {
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.lines-table tr:hover td {
  background: var(--surface2);
}

.lines-table input, .lines-table select {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 8px;
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  outline: none;
  width: 100%;
  min-width: 60px;
}

.lines-table input:focus, .lines-table select:focus {
  border-color: var(--accent);
}

.lines-table .num-input { text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 12px; }

.table-scroll { overflow-x: auto; }

/* ── BUTTONS ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary {
  background: var(--accent);
  color: #0a0e17;
}
.btn-primary:hover { opacity: 0.85; }

.btn-secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border);
}
.btn-secondary:hover { border-color: var(--border-bright); }

.btn-danger {
  background: var(--red-dim);
  color: var(--red);
  border: 1px solid transparent;
}
.btn-danger:hover { border-color: var(--red); }

.btn-sm { padding: 5px 10px; font-size: 12px; }

.btn-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

/* ── SUMMARY ── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.stat-card {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
}

.stat-card .label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-card .value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 20px;
  font-weight: 600;
  margin-top: 4px;
}

.stat-card .sub {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 2px;
}

.green { color: var(--green); }
.red { color: var(--red); }
.amber { color: var(--amber); }
.accent { color: var(--accent); }
.purple { color: var(--purple); }

/* ── BADGE ── */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-hot { background: var(--amber-dim); color: var(--amber); }
.badge-mfg { background: var(--green-dim); color: var(--green); }
.badge-sell { background: var(--red-dim); color: var(--red); }

/* ── SLIDER ── */
.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.slider-row label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-dim);
  white-space: nowrap;
}

.slider-row input[type="range"] {
  flex: 1;
  accent-color: var(--accent);
}

.slider-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  min-width: 40px;
  text-align: right;
}

/* ── TABS ── */
.tabs {
  display: flex;
  gap: 4px;
  background: var(--surface2);
  border-radius: 8px;
  padding: 3px;
  margin-bottom: 16px;
  width: fit-content;
}

.tab {
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-dim);
  background: transparent;
  border: none;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
}

.tab.active {
  background: var(--accent);
  color: #0a0e17;
}

/* ── DETAIL TABLE ── */
.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.detail-table th {
  text-align: left;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 2px solid var(--border);
  white-space: nowrap;
}

.detail-table td {
  padding: 7px 10px;
  border-bottom: 1px solid var(--border);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.detail-table tr:hover td { background: var(--surface2); }

.detail-table .right { text-align: right; }

/* ── Toggle ── */
.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: var(--border);
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  border: none;
}

.toggle.on { background: var(--accent); }

.toggle::after {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: white;
  top: 2px; left: 2px;
  transition: transform 0.2s;
}

.toggle.on::after { transform: translateX(16px); }

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.empty-state p { font-size: 14px; margin-bottom: 12px; }

/* ── PROCESS TYPE ── */
.process-selector {
  display: flex;
  gap: 4px;
  background: var(--surface2);
  border-radius: 8px;
  padding: 3px;
  width: fit-content;
}

.process-opt {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-dim);
  background: transparent;
  border: none;
  font-family: 'DM Sans', sans-serif;
}

.process-opt.active {
  background: var(--green);
  color: #0a0e17;
}

/* ── Labour input ── */
.labour-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.labour-row label { font-size: 12px; color: var(--text-dim); }
.labour-row input {
  width: 80px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 8px;
  color: var(--text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  text-align: right;
}
`;

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function TenderEntry() {
  // Tender header
  const [tender, setTender] = useState({
    source: "BONAS",
    mine: "Burgundy (Ekati)",
    lotId: "",
    lotDesc: "",
    totalRoughCts: "",
    date: new Date().toISOString().slice(0, 10),
    openingPrice: "",
    notes: "",
  });

  // Assortment lines
  const [lines, setLines] = useState([]);
  const [priceList, setPriceList] = useState("PL-A"); // PL-A or PL-M
  const [profitPct, setProfitPct] = useState(10);
  const [labourPerCt, setLabourPerCt] = useState(50);
  const [processType, setProcessType] = useState("whole"); // whole or sawn
  const [view, setView] = useState("entry"); // entry, summary, detail
  const [fluorDiscount, setFluorDiscount] = useState("None");

  const addLine = () => {
    setLines(prev => [...prev, {
      id: nextId(),
      sieve: SIEVE_RANGES[2].key,
      color: "G",
      clarity: "VS1",
      roughCts: "",
      pieces: "",
      yieldPct: processType === "sawn" ? 45 : 40,
      shape: "Round",
      fluorescence: "None",
    }]);
  };

  const updateLine = (id, field, value) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLine = (id) => {
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const duplicateLine = (id) => {
    setLines(prev => {
      const src = prev.find(l => l.id === id);
      if (!src) return prev;
      return [...prev, { ...src, id: nextId() }];
    });
  };

  // ── CALCULATIONS ──
  const calculated = useMemo(() => {
    return lines.map(line => {
      const roughCts = parseFloat(line.roughCts) || 0;
      const pieces = parseInt(line.pieces) || 0;
      const yieldPct = parseFloat(line.yieldPct) || 0;
      const effectiveYield = processType === "sawn" ? Math.min(yieldPct, 45) : yieldPct;
      const stoneMultiplier = processType === "sawn" ? 2 : 1;

      const polishCts = roughCts * (effectiveYield / 100);
      const sieveInfo = SIEVE_RANGES.find(s => s.key === line.sieve);
      const avgPolCt = sieveInfo ? sieveInfo.avgPolCt : 0.1;
      const polishPieces = pieces * stoneMultiplier;

      // Price lookup
      const key = `${line.sieve}|${line.color}|${line.clarity}`;
      const plaPrice = PL_A[key] || 0;
      const plmPrice = getPLM(line.sieve, line.color, line.clarity) || 0;
      const basePrice = priceList === "PL-A" ? plaPrice : plmPrice;

      // Fluorescence discount
      const fluorDisc = FLUOR_DISCOUNTS[line.fluorescence] || 0;
      const priceAfterFluor = basePrice * (1 - fluorDisc);

      // Manufacture vs sell
      const mfg = shouldManufacture(line.color, line.clarity);
      const effectivePrice = mfg ? priceAfterFluor : priceAfterFluor * 0.70;

      // Total polish value
      const polishValue = polishCts * effectivePrice;

      // Labour cost
      const labourCost = roughCts * labourPerCt;

      // Bid per rough ct
      const bidPerCt = roughCts > 0
        ? ((polishValue - labourCost) / roughCts) * (1 - profitPct / 100)
        : 0;

      // Total bid
      const totalBid = roughCts * bidPerCt;

      // Hot band
      const hotBand = getHotBand(avgPolCt);

      return {
        ...line,
        roughCts,
        pieces,
        effectiveYield,
        polishCts,
        avgPolCt,
        polishPieces,
        plaPrice,
        plmPrice,
        basePrice,
        fluorDisc,
        priceAfterFluor,
        mfg,
        effectivePrice,
        polishValue,
        labourCost,
        bidPerCt,
        totalBid,
        hotBand,
      };
    });
  }, [lines, priceList, profitPct, labourPerCt, processType]);

  // Totals
  const totals = useMemo(() => {
    const totalRoughCts = calculated.reduce((s, c) => s + c.roughCts, 0);
    const totalPolishCts = calculated.reduce((s, c) => s + c.polishCts, 0);
    const totalPolishValue = calculated.reduce((s, c) => s + c.polishValue, 0);
    const totalLabour = calculated.reduce((s, c) => s + c.labourCost, 0);
    const totalBid = calculated.reduce((s, c) => s + c.totalBid, 0);
    const totalPieces = calculated.reduce((s, c) => s + c.pieces, 0);
    const avgBidPerCt = totalRoughCts > 0 ? totalBid / totalRoughCts : 0;
    const blendedYield = totalRoughCts > 0 ? (totalPolishCts / totalRoughCts) * 100 : 0;
    const mfgLines = calculated.filter(c => c.mfg).length;
    const sellLines = calculated.filter(c => !c.mfg).length;
    const hotLines = calculated.filter(c => c.hotBand).length;

    return {
      totalRoughCts, totalPolishCts, totalPolishValue, totalLabour,
      totalBid, totalPieces, avgBidPerCt, blendedYield,
      mfgLines, sellLines, hotLines,
    };
  }, [calculated]);

  const fmt = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtUSD = (n) => '$' + fmt(n);

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* ── HEADER ── */}
        <div className="header">
          <div className="header-icon">💎</div>
          <div>
            <h1>EF Custom Tender Entry</h1>
            <p>Assort → Price → Bid — any source, any mine</p>
          </div>
        </div>

        {/* ── VIEW TABS ── */}
        <div className="tabs">
          <button className={`tab ${view === 'entry' ? 'active' : ''}`} onClick={() => setView('entry')}>
            Entry
          </button>
          <button className={`tab ${view === 'summary' ? 'active' : ''}`} onClick={() => setView('summary')}
            disabled={lines.length === 0}>
            Summary
          </button>
          <button className={`tab ${view === 'detail' ? 'active' : ''}`} onClick={() => setView('detail')}
            disabled={lines.length === 0}>
            Detail Report
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ── ENTRY VIEW ── */}
        {view === 'entry' && (
          <>
            {/* Tender Info */}
            <div className="section">
              <div className="section-title"><span className="dot" /> Tender Information</div>
              <div className="form-grid">
                <div className="field">
                  <label>Source</label>
                  <input value={tender.source} onChange={e => setTender(p => ({ ...p, source: e.target.value }))}
                    placeholder="BONAS, ODC, De Beers..." />
                </div>
                <div className="field">
                  <label>Mine / Origin</label>
                  <input value={tender.mine} onChange={e => setTender(p => ({ ...p, mine: e.target.value }))}
                    placeholder="Burgundy (Ekati), Debswana..." />
                </div>
                <div className="field">
                  <label>Lot ID</label>
                  <input value={tender.lotId} onChange={e => setTender(p => ({ ...p, lotId: e.target.value }))}
                    placeholder="e.g. BN-EK-001" />
                </div>
                <div className="field">
                  <label>Lot Description</label>
                  <input value={tender.lotDesc} onChange={e => setTender(p => ({ ...p, lotDesc: e.target.value }))}
                    placeholder="White Gem MB +11..." />
                </div>
                <div className="field">
                  <label>Total Rough Cts</label>
                  <input type="number" value={tender.totalRoughCts}
                    onChange={e => setTender(p => ({ ...p, totalRoughCts: e.target.value }))}
                    placeholder="From invoice" />
                </div>
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={tender.date}
                    onChange={e => setTender(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Opening Price ($/ct)</label>
                  <input type="number" value={tender.openingPrice}
                    onChange={e => setTender(p => ({ ...p, openingPrice: e.target.value }))}
                    placeholder="If known" />
                </div>
                <div className="field">
                  <label>Notes</label>
                  <input value={tender.notes} onChange={e => setTender(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Any observations..." />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="section">
              <div className="section-title"><span className="dot" style={{background:'var(--green)'}} /> Controls</div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Price List</label>
                  <div className="tabs" style={{ marginBottom: 0, marginTop: 6 }}>
                    <button className={`tab ${priceList === 'PL-A' ? 'active' : ''}`} onClick={() => setPriceList('PL-A')}>PL-A (Amay)</button>
                    <button className={`tab ${priceList === 'PL-M' ? 'active' : ''}`} onClick={() => setPriceList('PL-M')}>PL-M (Market)</button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Process</label>
                  <div className="process-selector" style={{ marginTop: 6 }}>
                    <button className={`process-opt ${processType === 'whole' ? 'active' : ''}`}
                      onClick={() => setProcessType('whole')}>Whole</button>
                    <button className={`process-opt ${processType === 'sawn' ? 'active' : ''}`}
                      onClick={() => setProcessType('sawn')}>Sawn</button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fluorescence</label>
                  <div className="tabs" style={{ marginBottom: 0, marginTop: 6 }}>
                    {["None","Faint","Medium","Strong"].map(f => (
                      <button key={f} className={`tab ${fluorDiscount === f ? 'active' : ''}`}
                        onClick={() => setFluorDiscount(f)} style={{ fontSize: 12, padding: '5px 10px' }}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="slider-row">
                <label>Profit %</label>
                <input type="range" min={0} max={30} step={0.5} value={profitPct}
                  onChange={e => setProfitPct(parseFloat(e.target.value))} />
                <span className="slider-val">{profitPct}%</span>
              </div>
              <div className="labour-row">
                <label>Labour $/ct rough:</label>
                <input type="number" value={labourPerCt}
                  onChange={e => setLabourPerCt(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            {/* Assortment Lines */}
            <div className="section">
              <div className="section-title"><span className="dot" style={{background:'var(--purple)'}} /> Assortment Lines</div>

              {lines.length === 0 ? (
                <div className="empty-state">
                  <p>No assortment lines yet. Add your first line below.</p>
                  <button className="btn btn-primary" onClick={addLine}>+ Add Line</button>
                </div>
              ) : (
                <>
                  <div className="table-scroll">
                    <table className="lines-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Sieve Range</th>
                          <th>Color</th>
                          <th>Clarity</th>
                          <th>Shape</th>
                          <th>Rough Cts</th>
                          <th>Pieces</th>
                          <th>Yield %</th>
                          <th>Fluor</th>
                          <th style={{textAlign:'right'}}>Pol $/ct</th>
                          <th style={{textAlign:'right'}}>Pol Value</th>
                          <th style={{textAlign:'right'}}>Bid $/ct</th>
                          <th>Mfg</th>
                          <th>Hot</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculated.map((c, i) => (
                          <tr key={c.id}>
                            <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{i + 1}</td>
                            <td>
                              <select value={c.sieve} onChange={e => updateLine(c.id, 'sieve', e.target.value)}>
                                {SIEVE_RANGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                              </select>
                            </td>
                            <td>
                              <select value={c.color} onChange={e => updateLine(c.id, 'color', e.target.value)} style={{width:60}}>
                                {COLORS.map(cl => <option key={cl} value={cl}>{cl}</option>)}
                              </select>
                            </td>
                            <td>
                              <select value={c.clarity} onChange={e => updateLine(c.id, 'clarity', e.target.value)} style={{width:70}}>
                                {CLARITIES.map(cl => <option key={cl} value={cl}>{cl}</option>)}
                              </select>
                            </td>
                            <td>
                              <select value={c.shape} onChange={e => updateLine(c.id, 'shape', e.target.value)} style={{width:80}}>
                                {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td>
                              <input className="num-input" type="number" step="0.01" value={c.roughCts || ''}
                                onChange={e => updateLine(c.id, 'roughCts', e.target.value)}
                                placeholder="0.00" style={{width:75}} />
                            </td>
                            <td>
                              <input className="num-input" type="number" value={c.pieces || ''}
                                onChange={e => updateLine(c.id, 'pieces', e.target.value)}
                                placeholder="0" style={{width:60}} />
                            </td>
                            <td>
                              <input className="num-input" type="number" step="0.5" value={c.yieldPct || ''}
                                onChange={e => updateLine(c.id, 'yieldPct', e.target.value)}
                                placeholder="40" style={{width:55}} />
                            </td>
                            <td>
                              <select value={c.fluorescence} onChange={e => updateLine(c.id, 'fluorescence', e.target.value)} style={{width:75, fontSize: 11}}>
                                {["None","Faint","Medium","Strong"].map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                            </td>
                            <td className="right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                              {fmtUSD(c.effectivePrice)}
                            </td>
                            <td className="right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                              {fmtUSD(c.polishValue)}
                            </td>
                            <td className="right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: c.bidPerCt > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                              {fmtUSD(c.bidPerCt)}
                            </td>
                            <td>
                              <span className={`badge ${c.mfg ? 'badge-mfg' : 'badge-sell'}`}>
                                {c.mfg ? 'MFG' : 'SELL'}
                              </span>
                            </td>
                            <td>
                              {c.hotBand && <span className="badge badge-hot">{c.hotBand.name}</span>}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => duplicateLine(c.id)} title="Duplicate">⧉</button>
                                <button className="btn btn-danger btn-sm" onClick={() => removeLine(c.id)} title="Remove">✕</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-primary" onClick={addLine}>+ Add Line</button>
                    <button className="btn btn-secondary" onClick={() => {
                      // Quick add 5 lines
                      for (let i = 0; i < 5; i++) addLine();
                    }}>+ Add 5 Lines</button>
                  </div>
                </>
              )}
            </div>

            {/* Quick Totals */}
            {lines.length > 0 && (
              <div className="section">
                <div className="section-title"><span className="dot" style={{background:'var(--amber)'}} /> Quick Totals</div>
                <div className="summary-grid">
                  <div className="stat-card">
                    <div className="label">Rough Carats</div>
                    <div className="value">{fmt(totals.totalRoughCts)}</div>
                    <div className="sub">{totals.totalPieces} pieces</div>
                  </div>
                  <div className="stat-card">
                    <div className="label">Polish Value</div>
                    <div className="value green">{fmtUSD(totals.totalPolishValue)}</div>
                    <div className="sub">Blended yield: {fmt(totals.blendedYield, 1)}%</div>
                  </div>
                  <div className="stat-card">
                    <div className="label">Total Bid</div>
                    <div className="value accent">{fmtUSD(totals.totalBid)}</div>
                    <div className="sub">Avg {fmtUSD(totals.avgBidPerCt)}/ct rough</div>
                  </div>
                  <div className="stat-card">
                    <div className="label">Labour Cost</div>
                    <div className="value red">{fmtUSD(totals.totalLabour)}</div>
                    <div className="sub">@ ${labourPerCt}/ct rough</div>
                  </div>
                  <div className="stat-card">
                    <div className="label">Lines</div>
                    <div className="value">{lines.length}</div>
                    <div className="sub">
                      <span className="green">{totals.mfgLines} mfg</span> · <span className="red">{totals.sellLines} sell</span> · <span className="amber">{totals.hotLines} hot</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ── SUMMARY VIEW ── */}
        {view === 'summary' && (
          <>
            <div className="section">
              <div className="section-title"><span className="dot" /> Tender Summary</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
                <strong>{tender.source}</strong> — {tender.mine} — Lot {tender.lotId || '(none)'} — {tender.date}
                {tender.lotDesc && <> — {tender.lotDesc}</>}
              </div>

              <div className="summary-grid">
                <div className="stat-card">
                  <div className="label">Total Rough</div>
                  <div className="value">{fmt(totals.totalRoughCts)} ct</div>
                  <div className="sub">{totals.totalPieces} pcs · {lines.length} lines</div>
                </div>
                <div className="stat-card">
                  <div className="label">Total Polish</div>
                  <div className="value">{fmt(totals.totalPolishCts)} ct</div>
                  <div className="sub">Yield: {fmt(totals.blendedYield, 1)}% ({processType})</div>
                </div>
                <div className="stat-card">
                  <div className="label">Polish Value ({priceList})</div>
                  <div className="value green">{fmtUSD(totals.totalPolishValue)}</div>
                  <div className="sub">{totals.totalPolishCts > 0 ? fmtUSD(totals.totalPolishValue / totals.totalPolishCts) : '$0'}/ct pol</div>
                </div>
                <div className="stat-card">
                  <div className="label">Labour</div>
                  <div className="value red">{fmtUSD(totals.totalLabour)}</div>
                  <div className="sub">@ ${labourPerCt}/ct rough</div>
                </div>
                <div className="stat-card">
                  <div className="label">Recommended Bid</div>
                  <div className="value accent">{fmtUSD(totals.totalBid)}</div>
                  <div className="sub">{fmtUSD(totals.avgBidPerCt)}/ct rough @ {profitPct}% margin</div>
                </div>
                <div className="stat-card">
                  <div className="label">Gross Profit</div>
                  <div className="value purple">{fmtUSD(totals.totalPolishValue - totals.totalLabour - totals.totalBid)}</div>
                  <div className="sub">{totals.totalBid > 0 ? fmt(((totals.totalPolishValue - totals.totalLabour - totals.totalBid) / totals.totalBid) * 100, 1) : '0'}% ROI</div>
                </div>
              </div>

              {tender.openingPrice && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Opening Price: </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600 }}>
                    ${parseFloat(tender.openingPrice).toLocaleString()}/ct
                  </span>
                  <span style={{ marginLeft: 16, fontSize: 12, color: totals.avgBidPerCt > parseFloat(tender.openingPrice) ? 'var(--red)' : 'var(--green)' }}>
                    Our bid is {totals.avgBidPerCt > parseFloat(tender.openingPrice) ? 'ABOVE' : 'BELOW'} opening ({fmt(((totals.avgBidPerCt - parseFloat(tender.openingPrice)) / parseFloat(tender.openingPrice)) * 100, 1)}%)
                  </span>
                </div>
              )}
            </div>

            {/* Mfg vs Sell breakdown */}
            <div className="section">
              <div className="section-title"><span className="dot" style={{background:'var(--green)'}} /> Manufacture vs Sell Breakdown</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="stat-card" style={{ borderColor: 'var(--green)', borderWidth: 1 }}>
                  <div className="label" style={{ color: 'var(--green)' }}>Manufacture (D-H × VVS-VS2)</div>
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    <div>{totals.mfgLines} lines</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmt(calculated.filter(c => c.mfg).reduce((s, c) => s + c.roughCts, 0))} ct rough
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--green)' }}>
                      {fmtUSD(calculated.filter(c => c.mfg).reduce((s, c) => s + c.polishValue, 0))} polish value
                    </div>
                  </div>
                </div>
                <div className="stat-card" style={{ borderColor: 'var(--red)', borderWidth: 1 }}>
                  <div className="label" style={{ color: 'var(--red)' }}>Sell-off @ 70% (rest)</div>
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    <div>{totals.sellLines} lines</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmt(calculated.filter(c => !c.mfg).reduce((s, c) => s + c.roughCts, 0))} ct rough
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--red)' }}>
                      {fmtUSD(calculated.filter(c => !c.mfg).reduce((s, c) => s + c.polishValue, 0))} polish value
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hot bands */}
            {totals.hotLines > 0 && (
              <div className="section">
                <div className="section-title"><span className="dot" style={{background:'var(--amber)'}} /> Hot Band Lines</div>
                <div className="table-scroll">
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th>Band</th>
                        <th>Sieve</th>
                        <th>Color</th>
                        <th>Clarity</th>
                        <th className="right">Rough Cts</th>
                        <th className="right">Pol Value</th>
                        <th className="right">Bid $/ct</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculated.filter(c => c.hotBand).map(c => (
                        <tr key={c.id}>
                          <td><span className="badge badge-hot">{c.hotBand.name}</span></td>
                          <td style={{ fontFamily: 'DM Sans' }}>{SIEVE_RANGES.find(s=>s.key===c.sieve)?.label}</td>
                          <td>{c.color}</td>
                          <td>{c.clarity}</td>
                          <td className="right">{fmt(c.roughCts)}</td>
                          <td className="right green">{fmtUSD(c.polishValue)}</td>
                          <td className="right accent">{fmtUSD(c.bidPerCt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ── DETAIL VIEW ── */}
        {view === 'detail' && (
          <div className="section">
            <div className="section-title"><span className="dot" style={{background:'var(--purple)'}} /> Full Detail Report</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>
              {tender.source} · {tender.mine} · Lot {tender.lotId || '—'} · {tender.date} · {priceList} · {processType} · Profit {profitPct}% · Labour ${labourPerCt}/ct
            </div>
            <div className="table-scroll">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sieve</th>
                    <th>Col</th>
                    <th>Clar</th>
                    <th>Shape</th>
                    <th>Fluor</th>
                    <th className="right">Rgh Cts</th>
                    <th className="right">Pcs</th>
                    <th className="right">Yield%</th>
                    <th className="right">Pol Cts</th>
                    <th className="right">Pol $/ct</th>
                    <th className="right">Pol Value</th>
                    <th className="right">Labour</th>
                    <th className="right">Bid $/ct</th>
                    <th className="right">Bid Total</th>
                    <th>Mfg</th>
                    <th>Hot</th>
                  </tr>
                </thead>
                <tbody>
                  {calculated.map((c, i) => (
                    <tr key={c.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontFamily: 'DM Sans', fontSize: 11 }}>{SIEVE_RANGES.find(s=>s.key===c.sieve)?.label}</td>
                      <td>{c.color}</td>
                      <td>{c.clarity}</td>
                      <td style={{ fontFamily: 'DM Sans', fontSize: 11 }}>{c.shape}</td>
                      <td style={{ fontSize: 10 }}>{c.fluorescence !== 'None' ? c.fluorescence : '—'}</td>
                      <td className="right">{fmt(c.roughCts)}</td>
                      <td className="right">{c.pieces}</td>
                      <td className="right">{fmt(c.effectiveYield, 1)}</td>
                      <td className="right">{fmt(c.polishCts)}</td>
                      <td className="right">{fmtUSD(c.effectivePrice)}</td>
                      <td className="right green">{fmtUSD(c.polishValue)}</td>
                      <td className="right red">{fmtUSD(c.labourCost)}</td>
                      <td className="right accent">{fmtUSD(c.bidPerCt)}</td>
                      <td className="right" style={{fontWeight:600}}>{fmtUSD(c.totalBid)}</td>
                      <td><span className={`badge ${c.mfg ? 'badge-mfg' : 'badge-sell'}`}>{c.mfg ? 'MFG' : 'SELL'}</span></td>
                      <td>{c.hotBand ? <span className="badge badge-hot">{c.hotBand.name}</span> : '—'}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr style={{ fontWeight: 700, borderTop: '2px solid var(--accent)' }}>
                    <td colSpan={6} style={{ fontFamily: 'DM Sans', fontSize: 13 }}>TOTALS</td>
                    <td className="right">{fmt(totals.totalRoughCts)}</td>
                    <td className="right">{totals.totalPieces}</td>
                    <td className="right">{fmt(totals.blendedYield, 1)}</td>
                    <td className="right">{fmt(totals.totalPolishCts)}</td>
                    <td className="right">—</td>
                    <td className="right green">{fmtUSD(totals.totalPolishValue)}</td>
                    <td className="right red">{fmtUSD(totals.totalLabour)}</td>
                    <td className="right accent">{fmtUSD(totals.avgBidPerCt)}</td>
                    <td className="right" style={{color:'var(--accent)'}}>{fmtUSD(totals.totalBid)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
