import { useState, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid } from "recharts";

/* ──────────── CONSTANTS ──────────── */
const COLORS_AST = ["DEF","G","H","IJ","K","L/M","CAPE"];
const CLARITIES = ["VVS","VS1","VS2","SI1","SI2","I1","I2"];
const SHAPES = ["Round","Pear/Oval","Baguette","Marquise"];

const SIEVE_RANGES = [
  { id:"s1", sieve:"-0000/-00", mm:"0.80-1.00", cts:"0.002-0.004", min:0.002, max:0.004 },
  { id:"s2", sieve:"+00/-2", mm:"1.00-1.25", cts:"0.005-0.008", min:0.005, max:0.008 },
  { id:"s3", sieve:"+2/-6.5", mm:"1.25-1.80", cts:"0.009-0.021", min:0.009, max:0.021 },
  { id:"s4", sieve:"+6.5/-9", mm:"1.80-2.30", cts:"0.022-0.051", min:0.022, max:0.051 },
  { id:"s5", sieve:"+9/-11", mm:"2.30-2.70", cts:"0.052-0.077", min:0.052, max:0.077 },
  { id:"s6", sieve:"+11/-13", mm:"2.70-3.10", cts:"0.078-0.115", min:0.078, max:0.115 },
  { id:"s7", sieve:"+13/-15", mm:"3.10-3.50", cts:"0.116-0.158", min:0.116, max:0.158 },
  { id:"s8", sieve:"+15/-16", mm:"3.50-3.80", cts:"0.159-0.200", min:0.159, max:0.200 },
];

const EF_PL = [
  {cts:0.001,b1:5210,b2:4000,b3:3700,b4:2405},{cts:0.001,b1:5210,b2:4000,b3:3700,b4:2405},
  {cts:0.001,b1:2755,b2:2375,b3:2230,b4:1450},{cts:0.002,b1:2755,b2:2210,b3:2135,b4:1390},
  {cts:0.002,b1:1770,b2:1450,b3:1300,b4:845},{cts:0.002,b1:1765,b2:1425,b3:1300,b4:845},
  {cts:0.003,b1:1455,b2:1150,b3:1000,b4:650},{cts:0.003,b1:1450,b2:1150,b3:1000,b4:650},
  {cts:0.004,b1:1300,b2:1025,b3:875,b4:570},{cts:0.004,b1:1250,b2:1025,b3:875,b4:570},
  {cts:0.005,b1:1105,b2:900,b3:800,b4:520},{cts:0.005,b1:1095,b2:900,b3:800,b4:520},
  {cts:0.006,b1:1105,b2:880,b3:775,b4:505},{cts:0.007,b1:1035,b2:830,b3:775,b4:505},
  {cts:0.008,b1:895,b2:770,b3:700,b4:455},{cts:0.009,b1:850,b2:725,b3:700,b4:455},
  {cts:0.01,b1:850,b2:715,b3:600,b4:390},{cts:0.011,b1:850,b2:715,b3:600,b4:390},
  {cts:0.012,b1:900,b2:750,b3:620,b4:405},{cts:0.013,b1:900,b2:730,b3:620,b4:405},
  {cts:0.014,b1:900,b2:765,b3:590,b4:385},{cts:0.016,b1:900,b2:730,b3:590,b4:385},
  {cts:0.018,b1:800,b2:675,b3:575,b4:375},{cts:0.018,b1:800,b2:675,b3:575,b4:375},
  {cts:0.021,b1:800,b2:685,b3:575,b4:375},{cts:0.021,b1:800,b2:685,b3:575,b4:375},
  {cts:0.025,b1:800,b2:695,b3:575,b4:375},{cts:0.025,b1:800,b2:695,b3:575,b4:375},
  {cts:0.029,b1:840,b2:710,b3:580,b4:375},{cts:0.029,b1:840,b2:700,b3:575,b4:375},
  {cts:0.035,b1:840,b2:710,b3:580,b4:375},{cts:0.035,b1:840,b2:710,b3:575,b4:375},
  {cts:0.039,b1:840,b2:705,b3:575,b4:375},{cts:0.039,b1:840,b2:705,b3:575,b4:375},
  {cts:0.044,b1:840,b2:710,b3:575,b4:375},{cts:0.044,b1:840,b2:720,b3:575,b4:375},
  {cts:0.044,b1:820,b2:710,b3:580,b4:375},{cts:0.044,b1:820,b2:710,b3:575,b4:375},
  {cts:0.052,b1:850,b2:730,b3:585,b4:380},{cts:0.052,b1:850,b2:730,b3:575,b4:375},
  {cts:0.069,b1:850,b2:740,b3:600,b4:390},{cts:0.069,b1:820,b2:740,b3:600,b4:390},
  {cts:0.074,b1:815,b2:735,b3:600,b4:390},{cts:0.074,b1:815,b2:735,b3:600,b4:390},
  {cts:0.078,b1:870,b2:785,b3:640,b4:415},{cts:0.078,b1:870,b2:785,b3:640,b4:415},
  {cts:0.086,b1:925,b2:835,b3:700,b4:455},{cts:0.086,b1:925,b2:835,b3:700,b4:455},
  {cts:0.095,b1:955,b2:860,b3:705,b4:460},{cts:0.095,b1:955,b2:860,b3:700,b4:455},
  {cts:0.108,b1:1020,b2:920,b3:750,b4:490},{cts:0.108,b1:1020,b2:920,b3:730,b4:475},
  {cts:0.116,b1:1030,b2:930,b3:750,b4:490},{cts:0.116,b1:1030,b2:930,b3:750,b4:490},
  {cts:0.135,b1:1030,b2:930,b3:755,b4:490},{cts:0.135,b1:1030,b2:930,b3:750,b4:490},
  {cts:0.135,b1:1055,b2:950,b3:780,b4:505},{cts:0.135,b1:1055,b2:950,b3:775,b4:505},
  {cts:0.146,b1:1145,b2:1030,b3:875,b4:570},{cts:0.146,b1:1145,b2:1030,b3:875,b4:570},
  {cts:0.159,b1:1220,b2:1100,b3:930,b4:605},{cts:0.159,b1:1220,b2:1100,b3:930,b4:605},
  {cts:0.175,b1:1245,b2:1120,b3:950,b4:620},{cts:0.175,b1:1245,b2:1120,b3:950,b4:620},
  {cts:0.175,b1:1275,b2:1150,b3:980,b4:635},{cts:0.175,b1:1275,b2:1150,b3:980,b4:635},
];

/* ──────────── PARCEL DEFINITIONS ──────────── */
const PARCEL_DEFS = [
  {
    id: "79_sw", label: "+7+9+11 GEM SW", type: "SW",
    segs: ["-9+7","-11+9","+11"],
    parcel: { date:"2026-03-16", tender:"ODC", number:"91", name:"+11+9+7 White Gem Z", totalCts:367.89, pcs:1184, lastSold:206, bidPrice:"" },
    flu: [
      { none:{c:16.77,s:107}, fnt:{c:1.33,s:9}, ms:{c:1.93,s:13} },
      { none:{c:47.61,s:182}, fnt:{c:1.37,s:6}, ms:{c:4.02,s:15} },
      { none:{c:41.25,s:85}, fnt:{c:2.78,s:5}, ms:{c:1.65,s:3} },
    ],
    segInfo: [{label:"-9+7",sCts:20.06,sPcs:129},{label:"-11+9",sCts:52.99,sPcs:203},{label:"+11",sCts:45.77,sPcs:93}],
    odcPrf: [{c1:30,c2:61,c3:9},{c1:28,c2:61,c3:11},{c1:27,c2:61,c3:12}], // real ODC Lot 91
    pre: [
      {"DEF":{"VVS":{pcs:46,cts:7.07},"VS1":{pcs:15,cts:2.33},"VS2":{pcs:7,cts:1.08}},"G":{"VVS":{pcs:56,cts:8.8},"VS1":{pcs:10,cts:1.55},"VS2":{pcs:3,cts:0.51}},"H":{"VVS":{pcs:60,cts:9.55},"VS1":{pcs:8,cts:1.244},"VS2":{pcs:5,cts:0.78}},"IJ":{"VVS":{pcs:31.07,cts:4.63}},"K":{"VVS":{pcs:44.18,cts:6.71}}},
      {"DEF":{"VVS":{pcs:87,cts:22.62},"VS1":{pcs:14,cts:3.65},"VS2":{pcs:4,cts:1.04}},"G":{"VVS":{pcs:93,cts:24.18},"VS1":{pcs:20,cts:5.22},"VS2":{pcs:5,cts:1.33}},"H":{"VVS":{pcs:105,cts:27.23},"VS1":{pcs:25,cts:6.53},"VS2":{pcs:7,cts:1.89}},"IJ":{"VVS":{pcs:87,cts:22.61},"VS1":{pcs:12,cts:3.13}},"K":{"VVS":{pcs:41.89,cts:10.93},"VS1":{pcs:7,cts:1.83}}},
      {"DEF":{"VVS":{pcs:74,cts:35.8},"VS1":{pcs:18,cts:8.71}},"G":{"VVS":{pcs:81,cts:39.7},"VS2":{pcs:2,cts:0.84}},"H":{"VVS":{pcs:67,cts:33.13},"VS1":{pcs:3,cts:1.48},"VS2":{pcs:2,cts:0.97}},"IJ":{"VVS":{pcs:100.04,cts:49.24},"VS2":{pcs:2,cts:0.97}},"K":{"VVS":{pcs:39,cts:19.12},"VS1":{pcs:2,cts:0.98},"VS2":{pcs:1,cts:0.36}}},
    ],
  },
  {
    id: "79_mb", label: "+7+9+11 GEM MB", type: "MB",
    segs: ["-9+7","-11+9","+11"],
    parcel: { date:"2026-03-16", tender:"ODC", number:"92", name:"+11+9+7 White Gem MB", totalCts:694.18, pcs:2480, lastSold:160, bidPrice:"" },
    flu: [
      { none:{c:26.5,s:165}, fnt:{c:6.22,s:40}, ms:{c:0,s:0} },
      { none:{c:56.47,s:225}, fnt:{c:5.43,s:21}, ms:{c:6.77,s:26} },
      { none:{c:64.67,s:131}, fnt:{c:9.68,s:20}, ms:{c:6.97,s:16} },
    ],
    segInfo: [{label:"-9+7",sCts:32.74,sPcs:205},{label:"-11+9",sCts:68.56,sPcs:272},{label:"+11",sCts:81.34,sPcs:167}],
    odcPrf: [{c1:47,c2:42,c3:11},{c1:43,c2:47,c3:10},{c1:37,c2:53,c3:10}], // real ODC Lot 92: -9+7/47-42-11, -11+9/43-47-10, +11/37-53-10
    pre_mb: [
      // -9+7: from Excel rows 15-38
      {"DEF":{"Round":{"VVS":{pcs:180,cts:28.864},"VS1":{pcs:40,cts:6.336}},"Pear/Oval":{"VVS":{pcs:32,cts:5.09},"VS1":{pcs:7,cts:1.12}}},"G":{"Round":{"VVS":{pcs:125,cts:19.86},"VS1":{pcs:22,cts:3.5}},"Pear/Oval":{"VVS":{pcs:13,cts:2.13},"VS1":{pcs:3,cts:0.47}}},"H":{"Round":{"VVS":{pcs:125,cts:19.92},"VS1":{pcs:22,cts:3.51}},"Pear/Oval":{"VVS":{pcs:29,cts:4.63},"VS1":{pcs:3,cts:0.51}}},"IJ":{"Round":{"VVS":{pcs:171,cts:27.31}},"Pear/Oval":{"VVS":{pcs:19,cts:3.03}}}},
      // -11+9: from Excel rows 48-72 (I+J merged into IJ)
      {"DEF":{"Round":{"VVS":{pcs:231,cts:57.82},"VS1":{pcs:58,cts:14.46}},"Pear/Oval":{"VVS":{pcs:29,cts:7.23},"VS1":{pcs:3,cts:0.8}}},"G":{"Round":{"VVS":{pcs:219,cts:54.83},"VS1":{pcs:36,cts:8.93}},"Pear/Oval":{"VVS":{pcs:39,cts:9.68},"VS1":{pcs:6,cts:1.58}}},"H":{"Round":{"VVS":{pcs:165,cts:39.42},"VS1":{pcs:29,cts:6.96}},"Pear/Oval":{"VVS":{pcs:33,cts:10.44},"VS1":{pcs:4,cts:1.16}}},"IJ":{"Round":{"VVS":{pcs:194,cts:48.62}},"Pear/Oval":{"VVS":{pcs:30,cts:7.54}}}},
      // +11: from Excel rows 82-106 (I separate + JK→K, I merged into IJ)
      {"DEF":{"Round":{"VVS":{pcs:122,cts:59.12},"VS1":{pcs:30,cts:14.78}},"Pear/Oval":{"VVS":{pcs:13,cts:6.15},"VS1":{pcs:4,cts:2.05}}},"G":{"Round":{"VVS":{pcs:91,cts:44.12},"VS1":{pcs:16,cts:7.79}},"Pear/Oval":{"VVS":{pcs:10,cts:4.93},"VS1":{pcs:2,cts:0.87}}},"H":{"Round":{"VVS":{pcs:84,cts:40.8},"VS1":{pcs:15,cts:7.2}},"Pear/Oval":{"VVS":{pcs:14,cts:7.23},"VS1":{pcs:3,cts:1.28}}},"IJ":{"Round":{"VVS":{pcs:36,cts:17.7}},"Pear/Oval":{"VVS":{pcs:8,cts:3.9}}},"K":{"Round":{"VVS":{pcs:120,cts:58.6},"VS1":{pcs:12,cts:5.8}},"Pear/Oval":{"VVS":{pcs:33,cts:16.1}}}},
    ],
  },
  {
    id: "53_sw", label: "+5+3 GEM SW", type: "SW",
    segs: ["-7+5","-5+3"],
    sampleExtrap: true, // combined sample → ratio → apply to each segment's full rough cts
    segRoughCts: [55.52, 3.88], // from ODC profile: -7+5=55.52, -5+3=3.88
    parcel: { date:"2026-03-16", tender:"ODC", number:"101", name:"+5+3 Gem SW", totalCts:59.41, pcs:0, lastSold:120, bidPrice:"" },
    flu: [
      { none:{c:15,s:135}, fnt:{c:0,s:0}, ms:{c:1.18,s:16} },
      { none:{c:15,s:135}, fnt:{c:0,s:0}, ms:{c:1.18,s:16} }, // same fluo for both segs (combined sample)
    ],
    segInfo: [{label:"-7+5",sCts:16.18,sPcs:151},{label:"-5+3",sCts:0,sPcs:0}],
    odcPrf: [{c1:47,c2:44,c3:9},{c1:47,c2:44,c3:9}], // real ODC: Lot 101 combined 47/44/9
    // Combined sample assortment (entered once, ratios applied to both segments)
    combinedSample: {"DEF":{"VVS":{pcs:90,cts:9.85}},"G":{"VVS":{pcs:55,cts:5.69}},"H":{"VVS":{pcs:6,cts:0.64}}},
    combinedSampleTotal: { cts: 16.18, pcs: 151 },
  },
  {
    id: "53_mb", label: "+5+3 GEM MB", type: "MB",
    segs: ["-7+5","-5+3"],
    sampleExtrap: true,
    segRoughCts: [191.13, 27.24], // from ODC profile: -7+5=191.13, -5+3=27.24
    parcel: { date:"2026-03-16", tender:"ODC", number:"102", name:"+5+3 Gem MB", totalCts:218.37, pcs:0, lastSold:102, bidPrice:"" },
    flu: [
      { none:{c:43.12,s:468}, fnt:{c:0,s:0}, ms:{c:8.38,s:82} },
      { none:{c:43.12,s:468}, fnt:{c:0,s:0}, ms:{c:8.38,s:82} }, // same fluo for both segs
    ],
    segInfo: [{label:"-7+5",sCts:51.49,sPcs:550},{label:"-5+3",sCts:0,sPcs:0}],
    odcPrf: [{c1:48,c2:43,c3:9},{c1:48,c2:43,c3:9}], // real ODC: Lot 102 combined 48/43/9
    combinedSample_mb: {"DEF":{"Round":{"VVS":{pcs:291,cts:27.13}}},"G":{"Round":{"VVS":{pcs:100,cts:8.96}}},"H":{"Round":{"VVS":{pcs:99,cts:8.96}}},"IJ":{"Round":{"VVS":{pcs:60,cts:5.43}}}},
    combinedSampleTotal: { cts: 50.48, pcs: 550 },
  },
];

/* ──────────── HELPERS ──────────── */
function getBk(ci, cli) {
  if (cli >= 4) return ["b4"];
  if (ci >= 3) return ["b4"];
  if (ci === 0) { if (cli === 0) return ["b1"]; if (cli <= 2) return ["b2"]; return ["b4"]; }
  if (ci === 1) { if (cli === 0) return ["b1","b3"]; return ["b3"]; }
  if (ci === 2) { if (cli <= 3) return ["b3"]; return ["b4"]; }
  return ["b4"];
}

function efPrice(sr, ci, cli) {
  const bk = getBk(ci, cli);
  const rows = EF_PL.filter(r => r.cts >= sr.min && r.cts <= sr.max);
  if (!rows.length) return 0;
  let t = 0;
  for (const r of rows) { let p = 0; for (const b of bk) p += r[b]; p /= bk.length; t += p; }
  return Math.round(t / rows.length);
}

function mkPM(shape) {
  const pm = {};
  for (const sr of SIEVE_RANGES) {
    pm[sr.id] = {};
    for (let ci = 0; ci < COLORS_AST.length; ci++) {
      pm[sr.id][COLORS_AST[ci]] = {};
      for (let cli = 0; cli < CLARITIES.length; cli++) {
        if (shape === "Round") { pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = efPrice(sr, ci, cli); }
        else if (shape === "Baguette") {
          if (sr.max <= 0.004 && ci <= 1 && cli === 0) pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = 2000;
          else if (sr.min >= 0.005 && sr.max <= 0.044 && ci <= 1 && cli <= 1) pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = 1450;
          else if (sr.min >= 0.005 && sr.max <= 0.044 && ci <= 2 && cli <= 1) pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = 950;
          else pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = Math.round(efPrice(sr, ci, cli) * 0.7);
        } else {
          if (cli <= 1) pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = 1250;
          else pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = 850;
        }
      }
    }
  }
  return pm;
}

function findSv(avg) {
  if (!avg || avg <= 0) return null;
  for (const sr of SIEVE_RANGES) if (avg >= sr.min && avg <= sr.max) return sr;
  if (avg < SIEVE_RANGES[0].min) return SIEVE_RANGES[0];
  return SIEVE_RANGES[SIEVE_RANGES.length - 1];
}

function buildA(type, segs, pre, pre_mb, def) {
  // For sample extrapolation parcels (+5+3): compute ratios from combined sample, apply to each segment's rough cts
  if (def?.sampleExtrap) {
    const sample = type === "MB" ? def.combinedSample_mb : def.combinedSample;
    const sTotal = def.combinedSampleTotal;
    if (!sample || !sTotal || !sTotal.cts) return segs.map(() => ({}));

    return segs.map((_, si) => {
      const segCts = def.segRoughCts?.[si] || 0;
      const ctsRatio = sTotal.cts > 0 ? segCts / sTotal.cts : 0;
      const s = {};
      COLORS_AST.forEach(c => {
        s[c] = {};
        if (type === "MB") {
          SHAPES.forEach(sh => {
            s[c][sh] = {};
            CLARITIES.forEach(cl => {
              const p = sample?.[c]?.[sh]?.[cl];
              if (p && (p.pcs || p.cts)) {
                s[c][sh][cl] = {
                  pcs: p.pcs ? Math.round(parseFloat(p.pcs) * ctsRatio) : "",
                  cts: p.cts ? Math.round(parseFloat(p.cts) * ctsRatio * 100) / 100 : ""
                };
              } else {
                s[c][sh][cl] = { pcs: "", cts: "" };
              }
            });
          });
        } else {
          CLARITIES.forEach(cl => {
            const p = sample?.[c]?.[cl];
            if (p && (p.pcs || p.cts)) {
              s[c][cl] = {
                pcs: p.pcs ? Math.round(parseFloat(p.pcs) * ctsRatio) : "",
                cts: p.cts ? Math.round(parseFloat(p.cts) * ctsRatio * 100) / 100 : ""
              };
            } else {
              s[c][cl] = { pcs: "", cts: "" };
            }
          });
        }
      });
      return s;
    });
  }

  // Normal path for +7+9+11 parcels (direct entry per segment)
  return segs.map((_, si) => {
    const s = {};
    COLORS_AST.forEach(c => {
      s[c] = {};
      if (type === "MB") {
        SHAPES.forEach(sh => {
          s[c][sh] = {};
          CLARITIES.forEach(cl => {
            const p = pre_mb?.[si]?.[c]?.[sh]?.[cl];
            s[c][sh][cl] = { pcs: p?.pcs ?? "", cts: p?.cts ?? "" };
          });
        });
      } else {
        CLARITIES.forEach(cl => {
          const p = pre?.[si]?.[c]?.[cl];
          s[c][cl] = { pcs: p?.pcs ?? "", cts: p?.cts ?? "" };
        });
      }
    });
    return s;
  });
}

const f = (v, d = 2) => (v != null && !isNaN(v)) ? Number(v).toFixed(d) : "";
const fd = (v) => (v != null && !isNaN(v) && v !== 0) ? "$" + Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "";

const isHot = (avgSize) => {
  if (!avgSize || avgSize <= 0) return false;
  if (avgSize >= 0.012 && avgSize <= 0.013) return true;  // Band 1
  if (avgSize >= 0.033 && avgSize <= 0.037) return true;   // Band 2
  if (avgSize >= 0.078 && avgSize <= 0.200) return true;   // Band 3 (s6+s7+s8)
  return false;
};

/* ──────────── CHART COLORS ──────────── */
const CK = { hot:"#16a34a", cold:"#dc2626", def:"#2563eb", g:"#0891b2", h:"#7c3aed", ij:"#c026d3", k:"#ea580c", lm:"#64748b", cape:"#92400e" };
const PIE_COL = ["#2563eb","#0891b2","#7c3aed","#c026d3","#ea580c","#64748b","#92400e"];

/* ──────────── NUMERIC INPUT ──────────── */
function NI({ value, onChange, style: st, className }) {
  return <input type="text" value={value ?? ""}
    onChange={e => { const v = e.target.value; if (v === "" || v === "." || /^-?\d*\.?\d*$/.test(v)) onChange(v === "" ? "" : v); }}
    onBlur={e => { const v = parseFloat(e.target.value); onChange(isNaN(v) ? "" : v); }}
    className={className || "ni"}
    style={st} />;
}

/* ──────────── STYLES (white theme) ──────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #f8f9fb; --card: #ffffff; --border: #e2e5ea; --border2: #d0d4dc;
  --text: #1a1d23; --text2: #4b5060; --text3: #8690a2;
  --blue: #2563eb; --blue-bg: #eff4ff; --green: #16a34a; --green-bg: #f0fdf4;
  --red: #dc2626; --red-bg: #fef2f2; --amber: #d97706; --amber-bg: #fffbeb;
  --purple: #7c3aed;
  --font: 'DM Sans', -apple-system, sans-serif;
  --mono: 'DM Mono', 'SF Mono', monospace;
}
body { font-family: var(--font); background: var(--bg); color: var(--text); font-size: 13px; }

.ni {
  background: var(--card); border: 1px solid var(--border); border-radius: 4px;
  padding: 4px 6px; color: var(--text); font-family: var(--mono); font-size: 12px;
  width: 68px; text-align: right; outline: none; transition: border-color .15s;
}
.ni:focus { border-color: var(--blue); box-shadow: 0 0 0 2px var(--blue-bg); }
.ni-yellow {
  background: #fffde7; border-color: #e5d85c;
}
.ni-yellow:focus { border-color: var(--amber); box-shadow: 0 0 0 2px var(--amber-bg); }

.hdr {
  background: var(--card); border-bottom: 1px solid var(--border);
  padding: 10px 24px; display: flex; align-items: center; gap: 14;
  position: sticky; top: 0; z-index: 50;
}
.logo { font-size: 15px; font-weight: 700; color: var(--blue); letter-spacing: 1.5px; display:flex; align-items:center; gap:6px; }
.logo svg { width: 20px; height: 20px; }

.badge {
  display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 20px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
}
.badge-blue { background: var(--blue-bg); color: var(--blue); }
.badge-green { background: var(--green-bg); color: var(--green); }
.badge-amber { background: var(--amber-bg); color: var(--amber); }
.badge-red { background: var(--red-bg); color: var(--red); }

.parcel-tabs {
  display: flex; gap: 0; background: var(--card); border-bottom: 1px solid var(--border);
  padding: 0 24px; overflow-x: auto;
}
.parcel-tab {
  padding: 10px 16px; cursor: pointer; font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1px; color: var(--text3);
  border-bottom: 2px solid transparent; background: none; border-top: none;
  border-left: none; border-right: none; font-family: var(--font); white-space: nowrap;
  transition: all .15s;
}
.parcel-tab:hover { color: var(--text2); }
.parcel-tab.active { color: var(--blue); border-bottom-color: var(--blue); }

.tabs {
  display: flex; gap: 0; background: var(--card); border-bottom: 1px solid var(--border);
  padding: 0 24px; overflow-x: auto;
}
.tab-btn {
  padding: 9px 16px; cursor: pointer; font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1.2px; color: var(--text3);
  border: none; border-bottom: 2px solid transparent; background: none;
  font-family: var(--font); white-space: nowrap; transition: all .15s;
}
.tab-btn:hover { color: var(--text2); }
.tab-btn.active { color: var(--blue); border-bottom-color: var(--blue); }

.body { padding: 16px 24px; max-width: 1520px; margin: 0 auto; }

.card {
  background: var(--card); border: 1px solid var(--border); border-radius: 8px;
  margin-bottom: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.card-hdr {
  padding: 8px 14px; background: #f1f3f7; border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
}
.card-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text2);
}
.card-body { padding: 12px 14px; }

.row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.field { display: flex; flex-direction: column; gap: 3px; }
.lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--text3); }

.inp {
  background: var(--card); border: 1px solid var(--border); border-radius: 4px;
  padding: 5px 8px; color: var(--text); font-size: 12px; font-family: var(--font); outline: none;
  transition: border-color .15s;
}
.inp:focus { border-color: var(--blue); box-shadow: 0 0 0 2px var(--blue-bg); }
.sel { composes: inp; }

table { width: 100%; border-collapse: collapse; font-size: 12px; }
th {
  padding: 5px 6px; background: #f1f3f7; border-bottom: 1px solid var(--border);
  text-align: center; font-weight: 700; font-size: 10px; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--text3); white-space: nowrap;
}
td { padding: 3px 5px; border-bottom: 1px solid #f1f3f7; text-align: right; color: var(--text); }
td.left { text-align: left; font-weight: 600; color: var(--blue); white-space: nowrap; }
td.left2 { text-align: left; color: var(--text3); font-size: 11px; }

.seg-btn {
  padding: 5px 14px; cursor: pointer; font-size: 11px; font-weight: 600;
  color: var(--text3); background: var(--card); border: 1px solid var(--border);
  border-radius: 4px; font-family: var(--font); transition: all .15s;
}
.seg-btn.active { color: #fff; background: var(--blue); border-color: var(--blue); }

.metric {
  background: #f8f9fb; padding: 10px 16px; border-radius: 6px; min-width: 100px; text-align: center;
  border: 1px solid var(--border);
}
.metric-val { font-size: 16px; font-weight: 700; color: var(--blue); font-family: var(--mono); }
.metric-label { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

.metric-green .metric-val { color: var(--green); }
.metric-green { border-left: 3px solid var(--green); }
.metric-red .metric-val { color: var(--red); }
.metric-red { border-left: 3px solid var(--red); }
.metric-amber .metric-val { color: var(--amber); }
.metric-amber { border-left: 3px solid var(--amber); }

.overflow-x { overflow-x: auto; }

.green { color: var(--green); } .red { color: var(--red); } .amber { color: var(--amber); }
.blue { color: var(--blue); } .purple { color: var(--purple); }
.bold { font-weight: 700; }

.chart-wrap { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
.chart-box { flex: 1; min-width: 320px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.chart-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text2); margin-bottom: 10px; }

.var-green { color: var(--green); font-weight: 700; }
.var-amber { color: var(--amber); font-weight: 700; }
.var-red { color: var(--red); font-weight: 700; }

.master-btn {
  padding: 6px 16px; cursor: pointer; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px; border: none; border-radius: 6px;
  font-family: var(--font); transition: all .2s; white-space: nowrap;
}
.master-btn.inactive {
  background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;
  box-shadow: 0 2px 8px rgba(217,119,6,.3);
}
.master-btn.inactive:hover { box-shadow: 0 4px 12px rgba(217,119,6,.45); transform: translateY(-1px); }
.master-btn.active {
  background: linear-gradient(135deg, #d97706, #b45309); color: #fff;
  box-shadow: 0 2px 8px rgba(217,119,6,.4); 
}
.hdr-divider { width: 1px; height: 24px; background: var(--border); margin: 0 4px; }
`;

/* ──────────── MAIN APP ──────────── */
const TABS = ["Parcel Input","Assortment","Polish Calc","Price Masters","Summary","Demand Forecast"];
const MASTER_TAB = 99; // special tab index for Master Summary

export default function App() {
  const [activePcl, setActivePcl] = useState(0);
  const [tab, setTab] = useState(0);

  // Per-parcel state
  const [parcels, setParcels] = useState(() => PARCEL_DEFS.map(d => ({
    ...d.parcel, type: d.type, segs: d.segInfo
  })));
  const [cfgs, setCfgs] = useState(() => PARCEL_DEFS.map(() => ({
    yld: { Round: 0.43, "Pear/Oval": 0.38, Baguette: 0.35, Marquise: 0.36 },
    mult: [[1.05,1.15,1.2],[1.10,1.15,1.2],[1.15,1.20,1.25],[1.10,1.15,1.2]],
    fd: { med:10, stg:25 }, efDisc: 15
  })));
  const [flus, setFlus] = useState(() => PARCEL_DEFS.map(d => d.flu));
  const [asts, setAsts] = useState(() => PARCEL_DEFS.map(d => buildA(d.type, d.segs, d.pre, d.pre_mb, d)));
  const [odcPrfs, setOdcPrfs] = useState(() => PARCEL_DEFS.map(d => d.odcPrf));
  const [pm] = useState(() => ({ Round: mkPM("Round"), "Pear/Oval": mkPM("Pear/Oval"), Baguette: mkPM("Baguette"), Marquise: mkPM("Marquise") }));
  const [pmOverrides, setPmOverrides] = useState({});

  // Master Summary — bid calculator state
  const [globalLabour, setGlobalLabour] = useState(30); // default $/ct labour
  const [globalProfit, setGlobalProfit] = useState(10); // default profit %
  const [perParcelBid, setPerParcelBid] = useState(() => PARCEL_DEFS.map(() => ({ labour: "", profit: "", useGlobal: true })));

  const [sg, setSg] = useState(0);
  const [ps, setPs] = useState("Round");
  const [pv, setPv] = useState("s1");

  const def = PARCEL_DEFS[activePcl];
  const parcel = parcels[activePcl];
  const cfg = cfgs[activePcl];
  const flu = flus[activePcl];
  const ast = asts[activePcl];
  const odcPrf = odcPrfs[activePcl];
  const SEGS = def.segs;

  const getPM = useCallback((sh, sv, co, cl) => {
    const k = `${activePcl}:${sh}:${sv}:${co}:${cl}`;
    if (pmOverrides[k] !== undefined) return pmOverrides[k];
    return pm[sh]?.[sv]?.[co]?.[cl] || 0;
  }, [pm, pmOverrides, activePcl]);

  const uPM = (sh, sv, co, cl, v) => {
    const k = `${activePcl}:${sh}:${sv}:${co}:${cl}`;
    setPmOverrides(p => ({ ...p, [k]: v === "" ? 0 : parseFloat(v) || 0 }));
  };

  // Update helpers
  const setParcel = fn => setParcels(p => { const n = [...p]; n[activePcl] = typeof fn === "function" ? fn(n[activePcl]) : fn; return n; });
  const setCfg = fn => setCfgs(p => { const n = [...p]; n[activePcl] = typeof fn === "function" ? fn(n[activePcl]) : fn; return n; });
  const setFlu = fn => setFlus(p => { const n = [...p]; n[activePcl] = typeof fn === "function" ? fn(n[activePcl]) : fn; return n; });
  const setAst = fn => setAsts(p => { const n = [...p]; n[activePcl] = typeof fn === "function" ? fn(n[activePcl]) : fn; return n; });
  const setOdcPrf = fn => setOdcPrfs(p => { const n = [...p]; n[activePcl] = typeof fn === "function" ? fn(n[activePcl]) : fn; return n; });

  const uA = (si, co, sh, cl, fk, v) => {
    setAst(p => { const n = JSON.parse(JSON.stringify(p)); if (def.type === "MB") n[si][co][sh][cl][fk] = v; else n[si][co][cl][fk] = v; return n; });
  };

  /* ──────── POLISH CALCULATION ──────── */
  const pol = useMemo(() => {
    const res = [];
    for (let si = 0; si < SEGS.length; si++) {
      const sr = []; const sg2 = ast[si]; const fl = flu[si];
      if (!fl) { res.push([]); continue; }
      const tf = (parseFloat(fl.none?.c) || 0) + (parseFloat(fl.fnt?.c) || 0) + (parseFloat(fl.ms?.c) || 0);
      const np = tf > 0 ? (parseFloat(fl.none?.c) || 0) / tf : 1;
      const fp = tf > 0 ? (parseFloat(fl.fnt?.c) || 0) / tf : 0;
      const mp = tf > 0 ? (parseFloat(fl.ms?.c) || 0) / tf : 0;
      const shps = def.type === "MB" ? SHAPES : ["Round"];
      for (const co of COLORS_AST) {
        for (const sh of shps) {
          for (const cl of CLARITIES) {
            let rP, rC;
            if (def.type === "MB") { rP = Math.round(parseFloat(sg2[co]?.[sh]?.[cl]?.pcs) || 0); rC = parseFloat(sg2[co]?.[sh]?.[cl]?.cts) || 0; }
            else { rP = Math.round(parseFloat(sg2[co]?.[cl]?.pcs) || 0); rC = parseFloat(sg2[co]?.[cl]?.cts) || 0; }
            if (rP === 0 && rC === 0) continue;
            const sI = SHAPES.indexOf(sh); const yi = cfg.yld[sh] || 0.43;
            const mu = cfg.mult[sI >= 0 ? sI : 0][si] || 1.05;
            const pC = rC * yi; const pP = Math.round(rP * mu);
            const av = pP > 0 ? pC / pP : 0;
            const sv = findSv(av);
            let rt = sv ? getPM(sh, sv.id, co, cl) : 0;
            if (av >= 0.052 && cfg.efDisc > 0) rt = Math.round(rt * (1 - cfg.efDisc / 100));
            const md = cfg.fd.med / 100; const sd = cfg.fd.stg / 100;
            const ef = rt * ((np + fp) + mp * (1 - (md + sd) / 2));
            const ppc = pP > 0 ? (pC * ef) / pP : 0;
            sr.push({ seg: SEGS[si], si, co, sh, cl, rP, rC, pC, pP, av, sieve: sv?.sieve || "N/A", mm: sv?.mm || "", rt, ef: Math.round(ef), tot: Math.round(pC * ef), ppc: Math.round(ppc * 100) / 100 });
          }
        }
      }
      res.push(sr);
    }
    return res;
  }, [ast, cfg, flu, def, SEGS, getPM]);

  const all = pol.flat();
  const gr = {
    rC: all.reduce((s, r) => s + r.rC, 0), rP: all.reduce((s, r) => s + r.rP, 0),
    pC: all.reduce((s, r) => s + r.pC, 0), pP: all.reduce((s, r) => s + r.pP, 0),
    tot: all.reduce((s, r) => s + r.tot, 0)
  };

  // Compute polish for ALL parcels (for Master Summary tab)
  const allParcelPolish = useMemo(() => {
    return PARCEL_DEFS.map((pDef, pi) => {
      const pAst = asts[pi]; const pCfg = cfgs[pi]; const pFlu = flus[pi];
      const pSegs = pDef.segs;
      const rows = [];
      for (let si = 0; si < pSegs.length; si++) {
        const sg2 = pAst[si]; const fl = pFlu[si];
        if (!fl || !sg2) continue;
        const tf = (parseFloat(fl.none?.c)||0) + (parseFloat(fl.fnt?.c)||0) + (parseFloat(fl.ms?.c)||0);
        const np = tf > 0 ? (parseFloat(fl.none?.c)||0)/tf : 1;
        const fp = tf > 0 ? (parseFloat(fl.fnt?.c)||0)/tf : 0;
        const mp = tf > 0 ? (parseFloat(fl.ms?.c)||0)/tf : 0;
        const shps = pDef.type === "MB" ? SHAPES : ["Round"];
        for (const co of COLORS_AST) {
          for (const sh of shps) {
            for (const cl of CLARITIES) {
              let rP, rC;
              if (pDef.type === "MB") { rP = Math.round(parseFloat(sg2[co]?.[sh]?.[cl]?.pcs)||0); rC = parseFloat(sg2[co]?.[sh]?.[cl]?.cts)||0; }
              else { rP = Math.round(parseFloat(sg2[co]?.[cl]?.pcs)||0); rC = parseFloat(sg2[co]?.[cl]?.cts)||0; }
              if (rP === 0 && rC === 0) continue;
              const sI = SHAPES.indexOf(sh); const yi = pCfg.yld[sh] || 0.43;
              const mu = pCfg.mult[sI >= 0 ? sI : 0][si] || 1.05;
              const pC = rC * yi; const pP = Math.round(rP * mu);
              const av = pP > 0 ? pC / pP : 0;
              const sv = findSv(av);
              const pmKey = `${pi}:${sh}:${sv?.id}:${co}:${cl}`;
              let rt = sv ? (pmOverrides[pmKey] !== undefined ? pmOverrides[pmKey] : (pm[sh]?.[sv.id]?.[co]?.[cl] || 0)) : 0;
              if (av >= 0.052 && pCfg.efDisc > 0) rt = Math.round(rt * (1 - pCfg.efDisc / 100));
              const md = pCfg.fd.med / 100; const sd = pCfg.fd.stg / 100;
              const ef = rt * ((np + fp) + mp * (1 - (md + sd) / 2));
              rows.push({ rP, rC, pC, pP, av, tot: Math.round(pC * ef) });
            }
          }
        }
      }
      const rC = rows.reduce((s,r)=>s+r.rC,0), rP = rows.reduce((s,r)=>s+r.rP,0);
      const pC = rows.reduce((s,r)=>s+r.pC,0), pP = rows.reduce((s,r)=>s+r.pP,0);
      const tot = rows.reduce((s,r)=>s+r.tot,0);
      const hotCts = rows.filter(r => isHot(r.av)).reduce((s,r)=>s+r.pC,0);
      const hotPct = pC > 0 ? hotCts / pC * 100 : 0;
      return { rC, rP, pC, pP, tot, hotPct, rows };
    });
  }, [asts, cfgs, flus, pm, pmOverrides]);

  const sum = useMemo(() => {
    const g = {};
    for (const r of all) {
      if (!g[r.sh]) g[r.sh] = {};
      if (!g[r.sh][r.co]) g[r.sh][r.co] = {};
      const k = r.mm || "N/A";
      if (!g[r.sh][r.co][k]) g[r.sh][r.co][k] = { pP: 0, pC: 0, tot: 0 };
      const m = g[r.sh][r.co][k]; m.pP += r.pP; m.pC += r.pC; m.tot += r.tot;
    }
    return g;
  }, [all]);

  /* ──────── HOT SIZES ──────── */
  const hotData = useMemo(() => {
    let hotCts = 0, hotPcs = 0, hotTot = 0, coldCts = 0, coldPcs = 0, coldTot = 0;
    for (const r of all) {
      if (isHot(r.av)) { hotCts += r.pC; hotPcs += r.pP; hotTot += r.tot; }
      else { coldCts += r.pC; coldPcs += r.pP; coldTot += r.tot; }
    }
    const totalPc = hotCts + coldCts;
    const hotPct = totalPc > 0 ? hotCts / totalPc * 100 : 0;
    const bands = [
      { label: "Band 1", range: "0.012-0.013ct", mm: "1.40-1.49mm", rows: all.filter(r => r.av >= 0.012 && r.av <= 0.013) },
      { label: "Band 2", range: "0.035ct", mm: "2.00-2.09mm", rows: all.filter(r => r.av >= 0.033 && r.av <= 0.037) },
      { label: "Band 3a (s6)", range: "0.078-0.115ct", mm: "2.70-3.10mm", rows: all.filter(r => r.av >= 0.078 && r.av <= 0.115) },
      { label: "Band 3b (s7)", range: "0.116-0.158ct", mm: "3.10-3.50mm", rows: all.filter(r => r.av >= 0.116 && r.av <= 0.158) },
      { label: "Band 3c (s8)", range: "0.159-0.200ct", mm: "3.50-3.80mm", rows: all.filter(r => r.av >= 0.159 && r.av <= 0.200) },
    ];
    return { hotCts, hotPcs, hotTot, coldCts, coldPcs, coldTot, totalPc, hotPct, bands };
  }, [all]);

  /* ──────── COLOR PROFILE (ODC) ──────── */
  const segProfiles = useMemo(() => {
    return SEGS.map((_, si) => {
      const sg2 = ast[si]; let c1 = 0, c2 = 0, c3 = 0, tot = 0;
      COLORS_AST.forEach(co => {
        const shapes = def.type === "MB" ? SHAPES : [null];
        shapes.forEach(sh => {
          CLARITIES.forEach(cl => {
            const cell = def.type === "MB" ? sg2[co]?.[sh]?.[cl] : sg2[co]?.[cl];
            const cts = parseFloat(cell?.cts) || 0;
            if (co === "DEF") c1 += cts; else if (["G","H","IJ"].includes(co)) c2 += cts; else c3 += cts;
            tot += cts;
          });
        });
      });
      return { c1, c2, c3, tot };
    });
  }, [ast, def, SEGS]);

  /* ──────── CHARTS DATA ──────── */
  const colorValueData = useMemo(() => {
    const d = {};
    for (const r of all) { d[r.co] = (d[r.co] || 0) + r.tot; }
    return COLORS_AST.filter(c => d[c]).map((c, i) => ({ name: c, value: Math.round(d[c] || 0), fill: PIE_COL[i % PIE_COL.length] }));
  }, [all]);

  const segBarData = useMemo(() => {
    return SEGS.map((seg, si) => {
      const sr = pol[si] || [];
      return { name: seg, rough: sr.reduce((s, r) => s + r.rC, 0), polish: sr.reduce((s, r) => s + r.pC, 0), value: sr.reduce((s, r) => s + r.tot, 0) };
    });
  }, [pol, SEGS]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{css}</style>

      {/* HEADER */}
      <div className="hdr">
        <div className="logo" style={{cursor:"pointer"}} onClick={() => { if (tab === MASTER_TAB) { setTab(0); } }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" /><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="8.5" x2="22" y2="8.5" /></svg>
          EF Rough Purchase Dashboard
        </div>
        <div className="hdr-divider"></div>
        <button className={`master-btn ${tab === MASTER_TAB ? "active" : "inactive"}`}
          onClick={() => setTab(tab === MASTER_TAB ? 0 : MASTER_TAB)}>
          {tab === MASTER_TAB ? "◆ Master Summary" : "◇ Master Summary"}
        </button>

        {tab !== MASTER_TAB && <>
          <span className="badge badge-blue" style={{ marginLeft: "auto" }}>{def.type === "SW" ? "Sawable" : "Makeable"}</span>
          <span className="badge badge-green">{parcel.tender}</span>
          <span className="badge badge-amber">#{parcel.number} — {parcel.name}</span>
        </>}
        {tab === MASTER_TAB && <span style={{marginLeft:"auto",fontSize:11,color:"var(--text3)"}}>All parcels · Bid calculator · Cross-parcel analysis</span>}
      </div>

      {/* PARCEL SELECTOR — hidden in master mode */}
      {tab !== MASTER_TAB && <div className="parcel-tabs">
        {PARCEL_DEFS.map((d, i) => (
          <button key={d.id} className={`parcel-tab ${activePcl === i ? "active" : ""}`}
            onClick={() => { setActivePcl(i); setSg(0); }}>{d.label}</button>
        ))}
      </div>}

      {/* TAB BAR — hidden in master mode */}
      {tab !== MASTER_TAB && <div className="tabs">
        {TABS.map((t, i) => <button key={t} className={`tab-btn ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>{t}</button>)}
      </div>}

      <div className="body">

        {/* ═══ TAB 0: PARCEL INPUT ═══ */}
        {tab === 0 && <>
          <div className="card">
            <div className="card-hdr"><span className="card-title">Parcel Info</span></div>
            <div className="card-body">
              <div className="row">
                {[["Date","date",130,"date"],["Tender","tender",80],["#","number",50],["Name","name",200]].map(([l,k,w,t2]) =>
                  <div key={k} className="field"><span className="lbl">{l}</span>
                    <input type={t2||"text"} value={parcel[k]} onChange={e => setParcel(p => ({...p,[k]:e.target.value}))} className="inp" style={{width:w}} /></div>
                )}
                <div className="field"><span className="lbl">Type</span>
                  <span className="badge badge-blue" style={{padding:"6px 12px",fontSize:12}}>{def.type === "SW" ? "Sawable" : "Makeable"}</span>
                </div>
              </div>
              <div className="row">
                {[["Total Cts","totalCts"],["Pcs","pcs"],["Last Sold $/ct","lastSold"],["Bid $/ct","bidPrice"]].map(([l,k]) =>
                  <div key={k} className="field"><span className="lbl">{l}</span><NI value={parcel[k]} onChange={v => setParcel(p => ({...p,[k]:v}))} /></div>
                )}
                <div className="field"><span className="lbl">Avg Size</span><span style={{color:"var(--text3)",padding:"5px 0",fontSize:12,fontFamily:"var(--mono)"}}>{parcel.totalCts && parcel.pcs ? f(parcel.totalCts / parcel.pcs, 4) : "—"}</span></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-hdr"><span className="card-title">Yield & Stone Multiplier</span><span style={{fontSize:10,color:"var(--text3)"}}>Multiplier per segment</span></div>
            <div className="card-body">
              <div className="overflow-x">
                <table><thead><tr><th style={{textAlign:"left"}}>Shape</th><th>Yield</th>
                  {SEGS.map(s => <th key={s}>Mult {s}</th>)}</tr></thead>
                  <tbody>{(def.type === "MB" ? SHAPES : ["Round"]).map((sh, si) => (
                    <tr key={sh}><td className="left">{sh}</td>
                      <td><NI value={cfg.yld[sh]} onChange={v => setCfg(c => ({...c, yld:{...c.yld, [sh]: v === "" ? "" : parseFloat(v) || 0}}))} /></td>
                      {SEGS.map((_, i) => <td key={i}><NI value={cfg.mult[si]?.[i]} onChange={v => setCfg(c => { const n = JSON.parse(JSON.stringify(c)); if (!n.mult[si]) n.mult[si] = [1,1,1]; n.mult[si][i] = v === "" ? "" : parseFloat(v) || 0; return n; })} /></td>)}
                    </tr>))}</tbody></table>
              </div>
              <div className="row" style={{marginTop:12}}>
                <div className="field"><span className="lbl">Med Fluo Disc %</span><NI value={cfg.fd.med} onChange={v => setCfg(c => ({...c, fd:{...c.fd, med: v === "" ? 0 : parseFloat(v) || 0}}))} /></div>
                <div className="field"><span className="lbl">Stg Fluo Disc %</span><NI value={cfg.fd.stg} onChange={v => setCfg(c => ({...c, fd:{...c.fd, stg: v === "" ? 0 : parseFloat(v) || 0}}))} /></div>
                <div style={{width:1,background:"var(--border)",margin:"0 6px"}}></div>
                <div className="field"><span className="lbl" style={{color:"var(--red)"}}>EF PL Disc % (0.052ct+)</span>
                  <NI value={cfg.efDisc} onChange={v => setCfg(c => ({...c, efDisc: v === "" ? 0 : parseFloat(v) || 0}))} className="ni" style={{borderColor:"#e5a0a0",background:"#fff5f5",color:"var(--red)"}} /></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-hdr"><span className="card-title">Size Segments</span>
              {def.sampleExtrap && <span style={{fontSize:10,color:"var(--text3)"}}>ODC Profile rough cts → assortment ratios from combined sample</span>}
            </div>
            <div className="card-body">{parcel.segs.map((s,i) => (
              <div key={i} className="row" style={{padding:"6px 0",borderBottom: i < SEGS.length - 1 ? "1px solid var(--border)" : "none"}}>
                <div className="field" style={{minWidth:50}}><span className="lbl">Seg</span><span style={{color:"var(--blue)",fontWeight:700}}>{s.label}</span></div>
                {def.sampleExtrap && <div className="field"><span className="lbl" style={{color:"var(--green)"}}>Full Rough Cts</span><span style={{color:"var(--green)",fontWeight:700,padding:"5px 0",fontFamily:"var(--mono)",fontSize:12}}>{def.segRoughCts?.[i] || "—"}</span></div>}
                <div className="field"><span className="lbl">Sample Cts</span><NI value={s.sCts} onChange={v => setParcel(p => { const sg2=[...p.segs]; sg2[i]={...sg2[i],sCts:v}; return {...p,segs:sg2}; })} /></div>
                <div className="field"><span className="lbl">Sample Pcs</span><NI value={s.sPcs} onChange={v => setParcel(p => { const sg2=[...p.segs]; sg2[i]={...sg2[i],sPcs:v}; return {...p,segs:sg2}; })} /></div>
                <div className="field"><span className="lbl">Avg Size</span><span style={{color:"var(--text3)",padding:"5px 0",fontFamily:"var(--mono)",fontSize:12}}>{s.sCts && s.sPcs ? f(s.sCts/s.sPcs,4) : "—"}</span></div>
              </div>))}</div>
          </div>
        </>}

        {/* ═══ TAB 1: ASSORTMENT ═══ */}
        {tab === 1 && <>
          <div style={{display:"flex",gap:4,marginBottom:12}}>{SEGS.map((s,i) => <button key={s} className={`seg-btn ${sg===i?"active":""}`} onClick={() => setSg(i)}>{s}</button>)}</div>
          <div className="card">
            <div className="card-hdr"><span className="card-title">Fluorescence — {SEGS[sg]}</span></div>
            <div className="card-body">
              <table><thead><tr><th style={{textAlign:"left"}}>Type</th><th>Cts</th><th>Stones</th><th>%</th></tr></thead>
                <tbody>{[["none","None"],["fnt","Faint"],["ms","Med/Stg"]].map(([k,l]) => {
                  const fl = flu[sg]; if (!fl) return null;
                  const t = (parseFloat(fl.none?.c)||0) + (parseFloat(fl.fnt?.c)||0) + (parseFloat(fl.ms?.c)||0);
                  return (<tr key={k}><td className="left">{l}</td>
                    <td><NI value={fl[k]?.c} className="ni ni-yellow" onChange={v => setFlu(x => { const n = JSON.parse(JSON.stringify(x)); if (!n[sg]) n[sg] = {none:{c:0,s:0},fnt:{c:0,s:0},ms:{c:0,s:0}}; n[sg][k].c = v; return n; })} /></td>
                    <td><NI value={fl[k]?.s} className="ni ni-yellow" onChange={v => setFlu(x => { const n = JSON.parse(JSON.stringify(x)); if (!n[sg]) n[sg] = {none:{c:0,s:0},fnt:{c:0,s:0},ms:{c:0,s:0}}; n[sg][k].s = v; return n; })} /></td>
                    <td style={{color:"var(--text3)"}}>{t > 0 ? f((parseFloat(fl[k]?.c)||0)/t*100,1) : "0.0"}%</td></tr>);
                })}</tbody></table>
            </div>
          </div>
          <div className="card">
            <div className="card-hdr"><span className="card-title">Assortment — {SEGS[sg]}</span>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span className="badge badge-amber">Yellow = input</span>
                {def.sampleExtrap && <span className="badge badge-blue">Extrapolated from combined sample × {def.segRoughCts?.[sg] || 0} cts</span>}
              </div>
            </div>
            <div className="overflow-x">
              <table><thead>
                <tr><th style={{textAlign:"left"}}>Color</th>{def.type === "MB" && <th style={{textAlign:"left"}}>Shape</th>}
                  {CLARITIES.map(c => <th key={c} colSpan={2}>{c}</th>)}<th colSpan={2}>Total</th></tr>
                <tr><th></th>{def.type === "MB" && <th></th>}
                  {CLARITIES.map(c => [<th key={c+"p"} style={{fontSize:8}}>PCS</th>,<th key={c+"c"} style={{fontSize:8}}>CTS</th>]).flat()}
                  <th style={{fontSize:8}}>PCS</th><th style={{fontSize:8}}>CTS</th></tr>
              </thead><tbody>
                {COLORS_AST.map(co => {
                  const shps = def.type === "MB" ? SHAPES : [null];
                  return shps.map((sh, si2) => {
                    let tP = 0, tC = 0;
                    CLARITIES.forEach(cl => { const c2 = def.type === "MB" ? ast[sg]?.[co]?.[sh]?.[cl] : ast[sg]?.[co]?.[cl]; tP += parseFloat(c2?.pcs)||0; tC += parseFloat(c2?.cts)||0; });
                    return (<tr key={co+(sh||"")} style={{borderTop: si2===0 ? "1px solid var(--border)" : "none"}}>
                      {si2 === 0 && <td className="left" rowSpan={shps.length}>{co}</td>}
                      {def.type === "MB" && <td className="left2">{sh}</td>}
                      {CLARITIES.map(cl => {
                        const c2 = def.type === "MB" ? ast[sg]?.[co]?.[sh]?.[cl] : ast[sg]?.[co]?.[cl];
                        return [
                          <td key={cl+"p"}><NI value={c2?.pcs ?? ""} className="ni ni-yellow" onChange={v => uA(sg,co,sh,cl,"pcs",v)} /></td>,
                          <td key={cl+"c"}><NI value={c2?.cts ?? ""} className="ni ni-yellow" onChange={v => uA(sg,co,sh,cl,"cts",v)} /></td>
                        ];
                      }).flat()}
                      <td className="blue bold">{tP ? Math.round(tP) : ""}</td><td className="blue bold">{tC ? f(tC) : ""}</td>
                    </tr>);
                  });
                })}
              </tbody></table>
            </div>
          </div>
        </>}

        {/* ═══ TAB 2: POLISH CALC ═══ */}
        {tab === 2 && <>
          <div style={{display:"flex",gap:4,marginBottom:12}}>{SEGS.map((s,i) => <button key={s} className={`seg-btn ${sg===i?"active":""}`} onClick={() => setSg(i)}>{s}</button>)}</div>
          <div className="card">
            <div className="card-hdr"><span className="card-title">Polish Output — {SEGS[sg]}</span></div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Color</th>
                {def.type === "MB" && <th style={{textAlign:"left"}}>Shape</th>}
                <th style={{textAlign:"left"}}>Clarity</th>
                <th>R.Pcs</th><th>R.Cts</th><th>P.Pcs</th><th>P.Cts</th>
                <th>Avg Size</th><th>Sieve</th><th>MM</th>
                <th>Base $/ct</th><th>Eff $/ct</th><th>$/pc</th><th>Total $</th>
              </tr></thead><tbody>
                {(pol[sg]||[]).map((r,i) => (
                  <tr key={i} style={{background: i%2===0 ? "transparent" : "#f8f9fb"}}>
                    <td className="left">{r.co}</td>
                    {def.type === "MB" && <td className="left2">{r.sh}</td>}
                    <td className="left2">{r.cl}</td>
                    <td>{f(r.rP,0)}</td><td>{f(r.rC,2)}</td>
                    <td className="blue">{f(r.pP,0)}</td><td className="blue">{f(r.pC,3)}</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:11}}>{f(r.av,4)}</td>
                    <td style={{fontSize:10,color:"var(--text3)"}}>{r.sieve}</td>
                    <td style={{fontSize:10,color:"var(--text3)"}}>{r.mm}</td>
                    <td>{fd(r.rt)}</td>
                    <td className="green bold">{fd(r.ef)}</td>
                    <td className="purple">{r.ppc > 0 ? "$"+f(r.ppc,2) : ""}</td>
                    <td className="amber bold">{fd(r.tot)}</td>
                  </tr>))}
                {!(pol[sg]||[]).length && <tr><td colSpan={14} style={{textAlign:"center",color:"var(--text3)",padding:30}}>No data — fill assortment first</td></tr>}
              </tbody></table>
            </div>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {[["Pol CTS",f((pol[sg]||[]).reduce((s2,r)=>s2+r.pC,0),2)],
              ["Pol PCS",f((pol[sg]||[]).reduce((s2,r)=>s2+r.pP,0),0)],
              ["Total $",fd((pol[sg]||[]).reduce((s2,r)=>s2+r.tot,0))],
              ["Avg $/ct",(()=>{ const t=(pol[sg]||[]).reduce((s2,r)=>s2+r.tot,0); const c=(pol[sg]||[]).reduce((s2,r)=>s2+r.pC,0); return c>0?fd(t/c):"—"; })()],
            ].map(([l,v]) => <div key={l} className="metric"><div className="metric-val">{v}</div><div className="metric-label">{l}</div></div>)}
          </div>

          {/* Debug: Avg Size per Cell with Hot Band highlighting */}
          <div className="card" style={{marginTop:14}}>
            <div className="card-hdr">
              <span className="card-title">Debug — Avg Polish Size per Cell (All Segments)</span>
              <div style={{display:"flex",gap:6,fontSize:10}}>
                <span style={{padding:"2px 8px",borderRadius:4,background:"#dcfce7",color:"var(--green)",fontWeight:600}}>Hot</span>
                <span style={{padding:"2px 8px",borderRadius:4,background:"#fef2f2",color:"var(--red)",fontWeight:600}}>No Demand</span>
              </div>
            </div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Seg</th>
                <th style={{textAlign:"left"}}>Color</th>
                {def.type === "MB" && <th style={{textAlign:"left"}}>Shape</th>}
                <th style={{textAlign:"left"}}>Clarity</th>
                <th>R.Pcs</th><th>R.Cts</th>
                <th>Yield</th><th>Mult</th>
                <th>P.Pcs</th><th>P.Cts</th>
                <th style={{fontWeight:800}}>Avg Size</th>
                <th>Sieve</th>
                <th>Hot?</th>
                <th>Band</th>
              </tr></thead><tbody>
                {pol.flat().map((r, i) => {
                  const hot = isHot(r.av);
                  let band = "—";
                  if (r.av >= 0.012 && r.av <= 0.013) band = "B1";
                  else if (r.av >= 0.033 && r.av <= 0.037) band = "B2";
                  else if (r.av >= 0.078 && r.av <= 0.115) band = "B3a";
                  else if (r.av >= 0.116 && r.av <= 0.158) band = "B3b";
                  else if (r.av >= 0.159 && r.av <= 0.200) band = "B3c";
                  const sI = SHAPES.indexOf(r.sh);
                  return (
                    <tr key={i} style={{background: hot ? "#f0fdf4" : i % 2 === 0 ? "transparent" : "#f8f9fb"}}>
                      <td className="left" style={{fontSize:10}}>{r.seg}</td>
                      <td className="left">{r.co}</td>
                      {def.type === "MB" && <td className="left2">{r.sh}</td>}
                      <td className="left2">{r.cl}</td>
                      <td>{f(r.rP,0)}</td>
                      <td>{f(r.rC,2)}</td>
                      <td style={{fontSize:10,color:"var(--text3)"}}>{cfg.yld[r.sh] || "—"}</td>
                      <td style={{fontSize:10,color:"var(--text3)"}}>{cfg.mult[sI >= 0 ? sI : 0]?.[r.si] || "—"}</td>
                      <td className="blue">{f(r.pP,0)}</td>
                      <td className="blue">{f(r.pC,3)}</td>
                      <td style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:700,color: hot ? "var(--green)" : "var(--text)"}}>{f(r.av,5)}</td>
                      <td style={{fontSize:10,color:"var(--text3)"}}>{r.sieve}</td>
                      <td style={{fontWeight:700,color: hot ? "var(--green)" : "var(--red)"}}>{hot ? "✓ HOT" : "✗"}</td>
                      <td style={{fontWeight:600,color: hot ? "var(--green)" : "var(--text3)"}}>{band}</td>
                    </tr>);
                })}
              </tbody></table>
            </div>
            <div style={{padding:"8px 14px",fontSize:10,color:"var(--text3)"}}>
              Hot bands: B1=0.012-0.013ct · B2=0.033-0.037ct · B3a=0.078-0.115ct (s6) · B3b=0.116-0.158ct (s7) · B3c=0.159-0.200ct (s8).
              Avg Size = Polish CTS / Polish PCS. Polish CTS = Rough CTS × Yield. Polish PCS = Round(Rough PCS × Stone Multiplier).
            </div>
          </div>
        </>}

        {/* ═══ TAB 3: PRICE MASTERS ═══ */}
        {tab === 3 && <>
          <div style={{display:"flex",gap:4,marginBottom:10}}>{SHAPES.map(s2 => <button key={s2} className={`seg-btn ${ps===s2?"active":""}`} onClick={() => setPs(s2)}>{s2}</button>)}</div>
          <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
            {SIEVE_RANGES.map(s2 => <button key={s2.id} className={`seg-btn ${pv===s2.id?"active":""}`} style={{fontSize:10}} onClick={() => setPv(s2.id)}>
              {s2.sieve} <span style={{color:"var(--text3)",fontSize:9}}>({s2.cts})</span></button>)}
          </div>
          <div className="card">
            <div className="card-hdr"><span className="card-title">{ps} — {SIEVE_RANGES.find(s2=>s2.id===pv)?.sieve} ({SIEVE_RANGES.find(s2=>s2.id===pv)?.mm}mm)</span></div>
            <div className="overflow-x">
              <table><thead><tr><th style={{textAlign:"left"}}>Color</th>
                {CLARITIES.map(c => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{COLORS_AST.map(c => (
                  <tr key={c}><td className="left">{c}</td>
                    {CLARITIES.map(cl => <td key={cl}><NI value={getPM(ps,pv,c,cl)} onChange={v => uPM(ps,pv,c,cl,v)} /></td>)}</tr>
                ))}</tbody></table>
            </div>
          </div>
        </>}

        {/* ═══ TAB 4: SUMMARY ═══ */}
        {tab === 4 && <>
          {/* Grand Totals */}
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:18}}>
            {[["Total Rough CTS",f(gr.rC,2)],["Total Rough PCS",f(gr.rP,0)],
              ["Exp Polish CTS",f(gr.pC,2)],["Exp Polish PCS",f(gr.pP,0)],
              ["Total Value",fd(gr.tot)],
              ["Rough $/ct",gr.rC>0?fd(gr.tot/gr.rC):"—"],
              ["Yield %",gr.rC>0?f(gr.pC/gr.rC*100,1)+"%":"—"],
            ].map(([l,v]) => <div key={l} className="metric"><div className="metric-val" style={{fontSize:14}}>{v}</div><div className="metric-label">{l}</div></div>)}
          </div>

          {/* CHARTS */}
          <div className="chart-wrap">
            <div className="chart-box">
              <div className="chart-title">Value by Segment</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={segBarData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e5ea" />
                  <XAxis dataKey="name" tick={{fontSize:11,fill:"#4b5060"}} />
                  <YAxis tick={{fontSize:10,fill:"#8690a2"}} tickFormatter={v => "$"+Math.round(v/1000)+"k"} />
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="value" name="Value $" fill="#2563eb" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-box">
              <div className="chart-title">Rough vs Polish CTS by Segment</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={segBarData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e5ea" />
                  <XAxis dataKey="name" tick={{fontSize:11,fill:"#4b5060"}} />
                  <YAxis tick={{fontSize:10,fill:"#8690a2"}} />
                  <Tooltip />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="rough" name="Rough CTS" fill="#94a3b8" radius={[4,4,0,0]} />
                  <Bar dataKey="polish" name="Polish CTS" fill="#2563eb" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-wrap">
            <div className="chart-box">
              <div className="chart-title">Value by Color</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={colorValueData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:10}}>
                    {colorValueData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-box">
              <div className="chart-title">Hot vs No-Demand Split</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[{name:"Hot Sizes",value:Math.round(hotData.hotTot)},{name:"No Demand",value:Math.round(hotData.coldTot)}]}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:10}}>
                    <Cell fill="#16a34a" /><Cell fill="#dc2626" />
                  </Pie>
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per Segment Table */}
          <div className="card">
            <div className="card-hdr"><span className="card-title">Per Segment</span></div>
            <div className="card-body overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Seg</th><th>R.CTS</th><th>R.PCS</th><th>P.CTS</th><th>P.PCS</th><th>Avg Size</th><th>Total $</th><th>$/ct pol</th>
              </tr></thead><tbody>
                {SEGS.map((_, si) => {
                  const sr = pol[si]||[];
                  const rc = sr.reduce((s2,r)=>s2+r.rC,0), rp = sr.reduce((s2,r)=>s2+r.rP,0);
                  const pc = sr.reduce((s2,r)=>s2+r.pC,0), pp = sr.reduce((s2,r)=>s2+r.pP,0);
                  const t = sr.reduce((s2,r)=>s2+r.tot,0);
                  return (<tr key={si}><td className="left">{SEGS[si]}</td>
                    <td>{f(rc,2)}</td><td>{f(rp,0)}</td>
                    <td className="blue">{f(pc,2)}</td><td className="blue">{f(pp,0)}</td>
                    <td>{pp>0?f(pc/pp,4):"—"}</td>
                    <td className="amber bold">{fd(t)}</td>
                    <td className="green bold">{pc>0?fd(t/pc):"—"}</td></tr>);
                })}
              </tbody></table>
            </div>
          </div>

          {/* Hot Size Summary — brief */}
          <div className="card">
            <div className="card-hdr">
              <span className="card-title">Demand Overview</span>
              <button className="seg-btn active" style={{fontSize:10,padding:"3px 10px"}} onClick={() => setTab(5)}>Open Full Analysis →</button>
            </div>
            <div className="card-body">
              <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                <div className="metric metric-green"><div className="metric-val">{f(hotData.hotPct,1)}%</div><div className="metric-label">Hot size %</div></div>
                <div className="metric metric-green"><div className="metric-val">{fd(hotData.hotTot)}</div><div className="metric-label">Hot value</div></div>
                <div className="metric metric-red"><div className="metric-val">{fd(hotData.coldTot)}</div><div className="metric-label">No demand value</div></div>
                <div className="metric metric-amber"><div className="metric-val">{gr.tot > 0 ? f(hotData.hotTot / gr.tot * 100, 1) + "%" : "—"}</div><div className="metric-label">Hot % of total $</div></div>
              </div>
            </div>
          </div>

          {/* ODC Profile Comparison */}
          <div className="card">
            <div className="card-hdr">
              <span className="card-title">ODC Profile vs Assortment — Color Comparison</span>
              <span style={{fontSize:10,color:"var(--text3)"}}>1 Col = DEF · 2 Col = G+H+IJ · 3 Col = K+LM+CAPE</span>
            </div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}} rowSpan={2}>Segment</th>
                <th colSpan={3}>ODC Profile %</th>
                <th style={{borderLeft:"2px solid var(--border2)"}} colSpan={3}>My Assortment %</th>
                <th style={{borderLeft:"2px solid var(--border2)"}} colSpan={3}>Variance</th>
              </tr><tr>
                {["1 Col","2 Col","3 Col","1 Col","2 Col","3 Col","1 Col","2 Col","3 Col"].map((h,i) =>
                  <th key={i} style={i===3||i===6?{borderLeft:"2px solid var(--border2)"}:{}}>{h}</th>)}
              </tr></thead><tbody>
                {SEGS.map((seg, si) => {
                  const p = segProfiles[si]; if (!p) return null;
                  const a1 = p.tot>0?p.c1/p.tot*100:0, a2=p.tot>0?p.c2/p.tot*100:0, a3=p.tot>0?p.c3/p.tot*100:0;
                  const o = odcPrf[si]; if (!o) return null;
                  const v1=a1-o.c1, v2=a2-o.c2, v3=a3-o.c3;
                  const vc = v => Math.abs(v)<=3?"var-green":Math.abs(v)<=8?"var-amber":"var-red";
                  return (<tr key={si}>
                    <td className="left">{seg}</td>
                    <td><NI value={o.c1} onChange={v => setOdcPrf(p2 => {const n=[...p2]; n[si]={...n[si],c1:v===""?0:parseFloat(v)||0}; return n;})} /></td>
                    <td><NI value={o.c2} onChange={v => setOdcPrf(p2 => {const n=[...p2]; n[si]={...n[si],c2:v===""?0:parseFloat(v)||0}; return n;})} /></td>
                    <td><NI value={o.c3} onChange={v => setOdcPrf(p2 => {const n=[...p2]; n[si]={...n[si],c3:v===""?0:parseFloat(v)||0}; return n;})} /></td>
                    <td style={{borderLeft:"2px solid var(--border2)"}} className="blue">{p.tot>0?f(a1,1)+"%":"—"}</td>
                    <td className="blue">{p.tot>0?f(a2,1)+"%":"—"}</td>
                    <td className="blue">{p.tot>0?f(a3,1)+"%":"—"}</td>
                    <td style={{borderLeft:"2px solid var(--border2)"}} className={vc(v1)}>{p.tot>0?(v1>=0?"+":"")+f(v1,1):"—"}</td>
                    <td className={vc(v2)}>{p.tot>0?(v2>=0?"+":"")+f(v2,1):"—"}</td>
                    <td className={vc(v3)}>{p.tot>0?(v3>=0?"+":"")+f(v3,1):"—"}</td>
                  </tr>);
                })}
                {(() => {
                  const totalAll = segProfiles.reduce((s,p)=>s+(p?.tot||0),0);
                  const totalC1 = segProfiles.reduce((s,p)=>s+(p?.c1||0),0);
                  const totalC2 = segProfiles.reduce((s,p)=>s+(p?.c2||0),0);
                  const totalC3 = segProfiles.reduce((s,p)=>s+(p?.c3||0),0);
                  return (<tr style={{borderTop:"2px solid var(--border)"}}>
                    <td className="left" style={{color:"var(--blue)"}}>Combined</td>
                    <td colSpan={3}></td>
                    <td style={{borderLeft:"2px solid var(--border2)"}} className="blue bold">{totalAll>0?f(totalC1/totalAll*100,1)+"%":"—"}</td>
                    <td className="blue bold">{totalAll>0?f(totalC2/totalAll*100,1)+"%":"—"}</td>
                    <td className="blue bold">{totalAll>0?f(totalC3/totalAll*100,1)+"%":"—"}</td>
                    <td style={{borderLeft:"2px solid var(--border2)"}} colSpan={3}></td>
                  </tr>);
                })()}
              </tbody></table>
            </div>
            <div style={{padding:"6px 14px",fontSize:10,color:"var(--text3)"}}>
              Variance: <span className="var-green">green ≤3%</span> · <span className="var-amber">amber 3-8%</span> · <span className="var-red">red &gt;8%</span> · ODC % is editable
            </div>
          </div>

          {/* Shape Detail Tables */}
          {Object.entries(sum).map(([sh, cols]) => {
            const sC = Object.values(cols).reduce((s2,ms)=>s2+Object.values(ms).reduce((s3,m)=>s3+m.pC,0),0);
            const sT = Object.values(cols).reduce((s2,ms)=>s2+Object.values(ms).reduce((s3,m)=>s3+m.tot,0),0);
            return (
              <div key={sh} className="card">
                <div className="card-hdr"><span className="card-title">{sh}</span>
                  <div style={{display:"flex",gap:8}}><span className="badge badge-blue">{f(sC,2)} cts</span><span className="badge badge-amber">{fd(sT)}</span></div></div>
                <div className="overflow-x">
                  <table><thead><tr>
                    <th style={{textAlign:"left"}}>Color</th><th style={{textAlign:"left"}}>MM Range</th>
                    <th>Pol PCS</th><th>Pol CTS</th><th>Avg $/ct</th><th>Avg $/pc</th><th>Total $</th>
                  </tr></thead><tbody>
                    {Object.entries(cols).map(([co,ms]) => {
                      const me = Object.entries(ms);
                      return me.map(([mm,d],mi) => (
                        <tr key={co+mm}>
                          {mi===0 && <td className="left" rowSpan={me.length}>{co}</td>}
                          <td className="left2">{mm}</td>
                          <td>{f(d.pP,0)}</td><td>{f(d.pC,3)}</td>
                          <td className="green">{d.pC>0?fd(d.tot/d.pC):"—"}</td>
                          <td className="purple">{d.pP>0?"$"+f(d.tot/d.pP,2):"—"}</td>
                          <td className="amber bold">{fd(d.tot)}</td>
                        </tr>));
                    })}
                    <tr style={{borderTop:"2px solid var(--border)"}}>
                      <td className="left" colSpan={2} style={{color:"var(--blue)"}}>Subtotal</td>
                      <td className="blue bold">{f(Object.values(cols).reduce((s2,ms)=>s2+Object.values(ms).reduce((s3,m)=>s3+m.pP,0),0),0)}</td>
                      <td className="blue bold">{f(sC,2)}</td>
                      <td className="green bold">{sC>0?fd(sT/sC):"—"}</td>
                      <td className="purple bold">{(()=>{const tp=Object.values(cols).reduce((s2,ms)=>s2+Object.values(ms).reduce((s3,m)=>s3+m.pP,0),0);return tp>0?"$"+f(sT/tp,2):"—";})()}</td>
                      <td className="amber bold">{fd(sT)}</td>
                    </tr>
                  </tbody></table>
                </div>
              </div>);
          })}
        </>}

        {/* ═══ TAB 5: DEMAND FORECAST ═══ */}
        {tab === 5 && (() => {
          // Per-band color breakdown
          const bandColorBreak = (bandRows) => {
            const g = {};
            for (const r of bandRows) {
              if (!g[r.co]) g[r.co] = { pC: 0, pP: 0, tot: 0 };
              g[r.co].pC += r.pC; g[r.co].pP += r.pP; g[r.co].tot += r.tot;
            }
            return g;
          };

          // Per-segment hot/cold
          const segDemand = SEGS.map((_, si) => {
            const sr = pol[si] || [];
            let hC = 0, hP = 0, hT = 0, cC = 0, cP = 0, cT = 0;
            for (const r of sr) {
              if (isHot(r.av)) { hC += r.pC; hP += r.pP; hT += r.tot; }
              else { cC += r.pC; cP += r.pP; cT += r.tot; }
            }
            const tot = hC + cC;
            return { hC, hP, hT, cC, cP, cT, tot, hotPct: tot > 0 ? hC / tot * 100 : 0 };
          });

          // No-demand detail by color
          const coldRows = all.filter(r => !isHot(r.av));
          const coldByColor = {};
          for (const r of coldRows) {
            if (!coldByColor[r.co]) coldByColor[r.co] = { pC: 0, pP: 0, tot: 0 };
            coldByColor[r.co].pC += r.pC; coldByColor[r.co].pP += r.pP; coldByColor[r.co].tot += r.tot;
          }

          // Chart data: band values
          const bandChartData = hotData.bands.map(b => ({
            name: b.label,
            value: Math.round(b.rows.reduce((s, r) => s + r.tot, 0)),
            cts: Math.round(b.rows.reduce((s, r) => s + r.pC, 0) * 100) / 100,
          }));

          // Chart data: per-segment hot vs cold
          const segHotColdData = SEGS.map((seg, si) => ({
            name: seg,
            Hot: Math.round(segDemand[si].hT),
            "No Demand": Math.round(segDemand[si].cT),
          }));

          return <>
          {/* KPI Metrics */}
          <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:18}}>
            <div className="metric metric-green"><div className="metric-val">{f(hotData.hotPct,1)}%</div><div className="metric-label">Hot size % (cts)</div></div>
            <div className="metric metric-green"><div className="metric-val">{f(hotData.hotCts,2)} ct</div><div className="metric-label">Hot pol cts</div></div>
            <div className="metric metric-green"><div className="metric-val">{f(hotData.hotPcs,0)}</div><div className="metric-label">Hot pol pcs</div></div>
            <div className="metric metric-green"><div className="metric-val">{fd(hotData.hotTot)}</div><div className="metric-label">Hot value</div></div>
            <div className="metric metric-red"><div className="metric-val">{f(hotData.coldCts,2)} ct</div><div className="metric-label">No demand cts</div></div>
            <div className="metric metric-red"><div className="metric-val">{f(hotData.coldPcs,0)}</div><div className="metric-label">No demand pcs</div></div>
            <div className="metric metric-red"><div className="metric-val">{fd(hotData.coldTot)}</div><div className="metric-label">No demand value</div></div>
            <div className="metric metric-amber"><div className="metric-val">{gr.tot > 0 ? f(hotData.hotTot / gr.tot * 100, 1) + "%" : "—"}</div><div className="metric-label">Hot % of total $</div></div>
          </div>

          {/* Charts */}
          <div className="chart-wrap">
            <div className="chart-box">
              <div className="chart-title">Value by Hot Band</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bandChartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e5ea" />
                  <XAxis dataKey="name" tick={{fontSize:10,fill:"#4b5060"}} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{fontSize:10,fill:"#8690a2"}} tickFormatter={v => "$"+Math.round(v/1000)+"k"} />
                  <Tooltip formatter={(v,name) => name === "cts" ? v + " ct" : "$"+Number(v).toLocaleString()} />
                  <Bar dataKey="value" name="Value $" fill="#16a34a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-box">
              <div className="chart-title">Hot vs No-Demand by Segment</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={segHotColdData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e5ea" />
                  <XAxis dataKey="name" tick={{fontSize:11,fill:"#4b5060"}} />
                  <YAxis tick={{fontSize:10,fill:"#8690a2"}} tickFormatter={v => "$"+Math.round(v/1000)+"k"} />
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="Hot" fill="#16a34a" radius={[4,4,0,0]} stackId="a" />
                  <Bar dataKey="No Demand" fill="#dc2626" radius={[4,4,0,0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-wrap">
            <div className="chart-box">
              <div className="chart-title">Hot vs No-Demand Value Split</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[{name:"Hot Sizes",value:Math.round(hotData.hotTot)},{name:"No Demand",value:Math.round(hotData.coldTot)}]}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:10}}>
                    <Cell fill="#16a34a" /><Cell fill="#dc2626" />
                  </Pie>
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-box">
              <div className="chart-title">Hot Band CTS Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={bandChartData.filter(b => b.cts > 0)} dataKey="cts" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:9}}>
                    {bandChartData.map((_, i) => <Cell key={i} fill={["#2563eb","#7c3aed","#0891b2","#c026d3","#ea580c"][i % 5]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => v + " ct"} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Band-wise Detail Table */}
          <div className="card" style={{borderColor:"#bbf7d0"}}>
            <div className="card-hdr"><span className="card-title">Hot Bands — Detail</span><span style={{fontSize:10,color:"var(--text3)"}}>EF PL highlighted sizes with active orders / demand forecast</span></div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Band</th><th style={{textAlign:"left"}}>Size Range</th><th style={{textAlign:"left"}}>MM Range</th>
                <th>Pol CTS</th><th>Pol PCS</th><th>Avg $/ct</th><th>Avg $/pc</th><th>Value</th><th>% of Pol CTS</th>
              </tr></thead><tbody>
                {hotData.bands.map((b,i) => {
                  const c = b.rows.reduce((s,r)=>s+r.pC,0), p = b.rows.reduce((s,r)=>s+r.pP,0), t = b.rows.reduce((s,r)=>s+r.tot,0);
                  return (<tr key={i} style={{background:"var(--green-bg)"}}>
                    <td className="left" style={{color:"var(--green)"}}>Hot — {b.label}</td>
                    <td className="left2">{b.range}</td><td className="left2">{b.mm}</td>
                    <td>{f(c,2)}</td><td>{f(p,0)}</td>
                    <td className="green">{c>0?fd(t/c):"—"}</td>
                    <td className="purple">{p>0?"$"+f(t/p,2):"—"}</td>
                    <td className="green bold">{fd(t)}</td>
                    <td>{hotData.totalPc>0?f(c/hotData.totalPc*100,1)+"%":"—"}</td>
                  </tr>);
                })}
                <tr style={{borderTop:"2px solid var(--border)",background:"var(--green-bg)"}}>
                  <td className="left" style={{color:"var(--green)"}} colSpan={3}>Total Hot</td>
                  <td className="green bold">{f(hotData.hotCts,2)}</td><td className="green bold">{f(hotData.hotPcs,0)}</td>
                  <td className="green bold">{hotData.hotCts>0?fd(hotData.hotTot/hotData.hotCts):"—"}</td>
                  <td className="purple bold">{hotData.hotPcs>0?"$"+f(hotData.hotTot/hotData.hotPcs,2):"—"}</td>
                  <td className="green bold">{fd(hotData.hotTot)}</td>
                  <td className="green bold">{f(hotData.hotPct,1)}%</td>
                </tr>
                <tr style={{background:"var(--red-bg)"}}>
                  <td className="left" style={{color:"var(--red)"}} colSpan={3}>No Demand / Inventory Risk</td>
                  <td className="red bold">{f(hotData.coldCts,2)}</td><td className="red bold">{f(hotData.coldPcs,0)}</td>
                  <td className="red">{hotData.coldCts>0?fd(hotData.coldTot/hotData.coldCts):"—"}</td>
                  <td className="red">{hotData.coldPcs>0?"$"+f(hotData.coldTot/hotData.coldPcs,2):"—"}</td>
                  <td className="red bold">{fd(hotData.coldTot)}</td>
                  <td className="red bold">{hotData.totalPc>0?f(100-hotData.hotPct,1)+"%":"—"}</td>
                </tr>
              </tbody></table>
            </div>
          </div>

          {/* Per-Band Color Breakdown */}
          {hotData.bands.map((b, bi) => {
            const bc = bandColorBreak(b.rows);
            const entries = Object.entries(bc).filter(([,d]) => d.tot > 0).sort((a,b) => b[1].tot - a[1].tot);
            const bandTotC = entries.reduce((s,[,d]) => s + d.pC, 0);
            const bandTotT = entries.reduce((s,[,d]) => s + d.tot, 0);
            if (!entries.length) return null;
            return (
              <div key={bi} className="card">
                <div className="card-hdr">
                  <span className="card-title">Hot — {b.label} — Color Breakdown</span>
                  <div style={{display:"flex",gap:6}}><span className="badge badge-green">{b.range}</span><span className="badge badge-green">{b.mm}</span></div>
                </div>
                <div className="overflow-x">
                  <table><thead><tr>
                    <th style={{textAlign:"left"}}>Color</th><th>Pol CTS</th><th>Pol PCS</th><th>Avg $/ct</th><th>Value</th><th>% of Band</th>
                  </tr></thead><tbody>
                    {entries.map(([co, d]) => (
                      <tr key={co}>
                        <td className="left">{co}</td>
                        <td>{f(d.pC,3)}</td><td>{f(d.pP,0)}</td>
                        <td className="green">{d.pC>0?fd(d.tot/d.pC):"—"}</td>
                        <td className="amber bold">{fd(d.tot)}</td>
                        <td>{bandTotT>0?f(d.tot/bandTotT*100,1)+"%":"—"}</td>
                      </tr>))}
                    <tr style={{borderTop:"2px solid var(--border)"}}>
                      <td className="left" style={{color:"var(--blue)"}}>Band Total</td>
                      <td className="blue bold">{f(bandTotC,2)}</td>
                      <td className="blue bold">{f(entries.reduce((s,[,d]) => s+d.pP,0),0)}</td>
                      <td className="green bold">{bandTotC>0?fd(bandTotT/bandTotC):"—"}</td>
                      <td className="amber bold">{fd(bandTotT)}</td>
                      <td>100%</td>
                    </tr>
                  </tbody></table>
                </div>
              </div>);
          })}

          {/* Per-Segment Hot/Cold Split */}
          <div className="card">
            <div className="card-hdr"><span className="card-title">Hot vs No-Demand — Per Segment</span></div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Segment</th>
                <th colSpan={3} style={{background:"var(--green-bg)",color:"var(--green)"}}>Hot Sizes</th>
                <th colSpan={3} style={{background:"var(--red-bg)",color:"var(--red)"}}>No Demand</th>
                <th>Hot %</th>
              </tr><tr>
                <th></th>
                <th style={{background:"var(--green-bg)"}}>Pol CTS</th><th style={{background:"var(--green-bg)"}}>Pol PCS</th><th style={{background:"var(--green-bg)"}}>Value</th>
                <th style={{background:"var(--red-bg)"}}>Pol CTS</th><th style={{background:"var(--red-bg)"}}>Pol PCS</th><th style={{background:"var(--red-bg)"}}>Value</th>
                <th></th>
              </tr></thead><tbody>
                {SEGS.map((seg, si) => {
                  const d = segDemand[si];
                  return (<tr key={si}>
                    <td className="left">{seg}</td>
                    <td className="green">{f(d.hC,2)}</td><td className="green">{f(d.hP,0)}</td><td className="green bold">{fd(d.hT)}</td>
                    <td className="red">{f(d.cC,2)}</td><td className="red">{f(d.cP,0)}</td><td className="red bold">{fd(d.cT)}</td>
                    <td className="bold" style={{color: d.hotPct > 60 ? "var(--green)" : d.hotPct > 30 ? "var(--amber)" : "var(--red)"}}>{f(d.hotPct,1)}%</td>
                  </tr>);
                })}
                <tr style={{borderTop:"2px solid var(--border)"}}>
                  <td className="left" style={{color:"var(--blue)"}}>Total</td>
                  <td className="green bold">{f(hotData.hotCts,2)}</td><td className="green bold">{f(hotData.hotPcs,0)}</td><td className="green bold">{fd(hotData.hotTot)}</td>
                  <td className="red bold">{f(hotData.coldCts,2)}</td><td className="red bold">{f(hotData.coldPcs,0)}</td><td className="red bold">{fd(hotData.coldTot)}</td>
                  <td className="bold" style={{color: hotData.hotPct > 60 ? "var(--green)" : hotData.hotPct > 30 ? "var(--amber)" : "var(--red)"}}>{f(hotData.hotPct,1)}%</td>
                </tr>
              </tbody></table>
            </div>
          </div>

          {/* No-Demand Color Detail */}
          <div className="card" style={{borderColor:"#fecaca"}}>
            <div className="card-hdr"><span className="card-title">No Demand — Color Breakdown (Inventory Risk)</span></div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Color</th><th>Pol CTS</th><th>Pol PCS</th><th>Avg $/ct</th><th>Value</th><th>% of No-Demand $</th>
              </tr></thead><tbody>
                {Object.entries(coldByColor).filter(([,d]) => d.tot > 0).sort((a,b) => b[1].tot - a[1].tot).map(([co, d]) => (
                  <tr key={co}>
                    <td className="left">{co}</td>
                    <td>{f(d.pC,3)}</td><td>{f(d.pP,0)}</td>
                    <td className="red">{d.pC>0?fd(d.tot/d.pC):"—"}</td>
                    <td className="red bold">{fd(d.tot)}</td>
                    <td>{hotData.coldTot>0?f(d.tot/hotData.coldTot*100,1)+"%":"—"}</td>
                  </tr>))}
              </tbody></table>
            </div>
            <div style={{padding:"8px 14px",fontSize:10,color:"var(--text3)"}}>
              No-demand sizes may sell at lower commercial prices or build inventory. Consider adjusting bid price to account for inventory holding risk.
            </div>
          </div>

          <div style={{padding:"10px 0",fontSize:10,color:"var(--text3)"}}>
            Hot sizes defined as: Band 1 (0.012-0.013ct / 1.40-1.49mm) · Band 2 (0.035ct / 2.00-2.09mm) · Band 3a-c (0.078-0.200ct / 2.70-3.80mm, split by sieve s6/s7/s8). Based on EF PL purple-highlighted rows with active brand orders.
          </div>
          </>;
        })()}

        {/* ═══ MASTER SUMMARY (separate mode) ═══ */}
        {tab === MASTER_TAB && (() => {
          const getLabour = (pi) => {
            const pp = perParcelBid[pi];
            return pp && !pp.useGlobal && pp.labour !== "" ? parseFloat(pp.labour) || 0 : globalLabour;
          };
          const getProfit = (pi) => {
            const pp = perParcelBid[pi];
            return pp && !pp.useGlobal && pp.profit !== "" ? parseFloat(pp.profit) || 0 : globalProfit;
          };
          // Correct formula: Bid = ((Pol Value - Labour×Rough CTS) / Rough CTS) × (1 - Profit%)
          // = (Pol$/ct_rough - Labour$/ct) × (1 - Profit%)  [same algebra, but labour is per rough ct]
          const calcBid = (polValue, roughCts, labourPerCt, profitPct) => {
            if (roughCts <= 0) return 0;
            const totalLabour = labourPerCt * roughCts;
            const netValue = polValue - totalLabour;
            const netPerCt = netValue / roughCts;
            return netPerCt * (1 - profitPct / 100);
          };

          // Grand totals
          const gRc = allParcelPolish.reduce((s,p)=>s+p.rC,0);
          const gPc = allParcelPolish.reduce((s,p)=>s+p.pC,0);
          const gTot = allParcelPolish.reduce((s,p)=>s+p.tot,0);

          return <>
          {/* Global Defaults */}
          <div className="card">
            <div className="card-hdr">
              <span className="card-title">Bid Calculator — Global Defaults</span>
              <span style={{fontSize:10,color:"var(--text3)"}}>Override per parcel below if needed</span>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="field">
                  <span className="lbl">Labour Cost $/ct (Rough)</span>
                  <NI value={globalLabour} onChange={v => setGlobalLabour(v === "" ? 0 : parseFloat(v) || 0)} style={{width:90,fontSize:14,fontWeight:700,padding:"6px 10px"}} />
                </div>
                <div className="field">
                  <span className="lbl">Profit Margin %</span>
                  <NI value={globalProfit} onChange={v => setGlobalProfit(v === "" ? 0 : parseFloat(v) || 0)} style={{width:90,fontSize:14,fontWeight:700,padding:"6px 10px"}} />
                </div>
                <div style={{alignSelf:"flex-end",paddingBottom:4,fontSize:11,color:"var(--text3)"}}>
                  Formula: <strong style={{color:"var(--text)"}}>Bid = ((Pol Value − Labour$/ct × Rough CTS) / Rough CTS) × (1 − Profit%)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Master Table */}
          <div className="card">
            <div className="card-hdr"><span className="card-title">All Parcels — Overview & Bid Price</span></div>
            <div className="overflow-x">
              <table><thead>
                <tr>
                  <th style={{textAlign:"left"}} rowSpan={2}>Lot</th>
                  <th style={{textAlign:"left"}} rowSpan={2}>Parcel</th>
                  <th rowSpan={2}>Type</th>
                  <th colSpan={2}>Rough</th>
                  <th colSpan={2}>Polish</th>
                  <th rowSpan={2}>Yield %</th>
                  <th rowSpan={2}>Pol Value</th>
                  <th rowSpan={2}>Pol $/ct</th>
                  <th style={{borderLeft:"2px solid var(--border2)"}} rowSpan={2}>Rough $/ct<br/><span style={{fontSize:8,fontWeight:400,color:"var(--text3)"}}>Pol Val / R.Cts</span></th>
                  <th rowSpan={2}>Last Sold</th>
                  <th rowSpan={2}>Hot %</th>
                  <th style={{borderLeft:"2px solid var(--border2)"}} colSpan={4} style={{background:"var(--blue-bg)",color:"var(--blue)",borderLeft:"2px solid var(--border2)"}}>Bid Calculator</th>
                </tr>
                <tr>
                  <th>CTS</th><th>PCS</th><th>CTS</th><th>PCS</th>
                  <th style={{background:"var(--blue-bg)",borderLeft:"2px solid var(--border2)"}}>Labour</th>
                  <th style={{background:"var(--blue-bg)"}}>Profit %</th>
                  <th style={{background:"var(--green-bg)",color:"var(--green)"}}>Bid $/ct</th>
                  <th style={{background:"var(--green-bg)",color:"var(--green)"}}>vs Last</th>
                </tr>
              </thead><tbody>
                {PARCEL_DEFS.map((pDef, pi) => {
                  const p = allParcelPolish[pi];
                  const pcl = parcels[pi];
                  const roughPerCt = p.rC > 0 ? p.tot / p.rC : 0;
                  const polPerCt = p.pC > 0 ? p.tot / p.pC : 0;
                  const yld = p.rC > 0 ? p.pC / p.rC * 100 : 0;
                  const labour = getLabour(pi);
                  const profit = getProfit(pi);
                  const bid = calcBid(p.tot, p.rC, labour, profit);
                  const totalLabour = labour * p.rC;
                  const lastSold = parseFloat(pcl.lastSold) || 0;
                  const vsPrev = lastSold > 0 ? ((bid - lastSold) / lastSold * 100) : 0;
                  const pp = perParcelBid[pi];
                  const isOverride = pp && !pp.useGlobal;

                  return (
                    <tr key={pi} style={{borderTop:"1px solid var(--border)"}}>
                      <td className="left">#{pcl.number}</td>
                      <td className="left" style={{maxWidth:160}}>{pDef.label}</td>
                      <td><span className={`badge ${pDef.type === "SW" ? "badge-blue" : "badge-amber"}`} style={{fontSize:9}}>{pDef.type}</span></td>
                      <td>{f(p.rC,1)}</td>
                      <td>{f(p.rP,0)}</td>
                      <td className="blue">{f(p.pC,1)}</td>
                      <td className="blue">{f(p.pP,0)}</td>
                      <td>{f(yld,1)}%</td>
                      <td className="amber bold">{fd(p.tot)}</td>
                      <td>{polPerCt > 0 ? fd(polPerCt) : "—"}</td>
                      <td style={{borderLeft:"2px solid var(--border2)",fontWeight:700,color:"var(--blue)"}}>{roughPerCt > 0 ? fd(roughPerCt) : "—"}</td>
                      <td>{lastSold > 0 ? "$"+lastSold : "—"}</td>
                      <td style={{color: p.hotPct > 50 ? "var(--green)" : p.hotPct > 20 ? "var(--amber)" : "var(--red)"}}>{f(p.hotPct,0)}%</td>
                      <td style={{borderLeft:"2px solid var(--border2)"}}>
                        <NI value={isOverride ? pp.labour : globalLabour}
                          className={`ni ${isOverride ? "ni-yellow" : ""}`}
                          style={{width:55}}
                          onChange={v => setPerParcelBid(prev => { const n=[...prev]; n[pi]={...n[pi], labour: v, useGlobal: false}; return n; })}
                        />
                      </td>
                      <td>
                        <NI value={isOverride ? pp.profit : globalProfit}
                          className={`ni ${isOverride ? "ni-yellow" : ""}`}
                          style={{width:50}}
                          onChange={v => setPerParcelBid(prev => { const n=[...prev]; n[pi]={...n[pi], profit: v, useGlobal: false}; return n; })}
                        />
                      </td>
                      <td style={{fontWeight:800,fontSize:14,color: bid > 0 ? "var(--green)" : "var(--text3)"}}>{bid > 0 ? "$"+f(bid,0) : "—"}</td>
                      <td style={{fontWeight:600,fontSize:11,color: vsPrev > 0 ? "var(--red)" : vsPrev < 0 ? "var(--green)" : "var(--text3)"}}>
                        {lastSold > 0 && bid > 0 ? (vsPrev >= 0 ? "+" : "") + f(vsPrev,1) + "%" : "—"}
                      </td>
                    </tr>);
                })}
                {/* Grand Totals */}
                <tr style={{borderTop:"3px solid var(--border)",background:"#f1f3f7"}}>
                  <td className="left" colSpan={3} style={{color:"var(--blue)",fontSize:12}}>GRAND TOTAL</td>
                  <td className="bold">{f(gRc,1)}</td>
                  <td className="bold">{f(allParcelPolish.reduce((s,p)=>s+p.rP,0),0)}</td>
                  <td className="blue bold">{f(gPc,1)}</td>
                  <td className="blue bold">{f(allParcelPolish.reduce((s,p)=>s+p.pP,0),0)}</td>
                  <td className="bold">{gRc > 0 ? f(gPc/gRc*100,1)+"%" : "—"}</td>
                  <td className="amber bold">{fd(gTot)}</td>
                  <td className="bold">{gPc > 0 ? fd(gTot/gPc) : "—"}</td>
                  <td style={{borderLeft:"2px solid var(--border2)",fontWeight:800,color:"var(--blue)"}}>{gRc > 0 ? fd(gTot/gRc) : "—"}</td>
                  <td colSpan={2}></td>
                  <td style={{borderLeft:"2px solid var(--border2)"}} colSpan={4}></td>
                </tr>
              </tbody></table>
            </div>
            <div style={{padding:"8px 14px",fontSize:10,color:"var(--text3)",display:"flex",gap:16}}>
              <span>Yellow inputs = per-parcel override (differs from global)</span>
              <span>vs Last = % difference between your bid and last auction sold price</span>
              <span style={{color:"var(--green)"}}>Green bid = below last sold</span>
              <span style={{color:"var(--red)"}}>Red bid = above last sold</span>
            </div>
          </div>

          {/* Per-Parcel Bid Detail Cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(340px, 1fr))",gap:14}}>
            {PARCEL_DEFS.map((pDef, pi) => {
              const p = allParcelPolish[pi];
              const pcl = parcels[pi];
              const roughPerCt = p.rC > 0 ? p.tot / p.rC : 0;
              const labour = getLabour(pi);
              const profit = getProfit(pi);
              const bid = calcBid(p.tot, p.rC, labour, profit);
              const lastSold = parseFloat(pcl.lastSold) || 0;
              const totalLabour = labour * p.rC;
              const netValue = p.tot - totalLabour;
              const netPerCt = p.rC > 0 ? netValue / p.rC : 0;
              const yld = p.rC > 0 ? p.pC / p.rC * 100 : 0;

              return (
                <div key={pi} className="card">
                  <div className="card-hdr">
                    <span className="card-title" style={{fontSize:10}}>#{pcl.number} {pDef.label}</span>
                    <span className={`badge ${pDef.type === "SW" ? "badge-blue" : "badge-amber"}`}>{pDef.type}</span>
                  </div>
                  <div className="card-body">
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                      <div><span className="lbl">Rough CTS</span><div style={{fontFamily:"var(--mono)",fontWeight:600}}>{f(p.rC,2)}</div></div>
                      <div><span className="lbl">Polish CTS</span><div style={{fontFamily:"var(--mono)",fontWeight:600,color:"var(--blue)"}}>{f(p.pC,2)}</div></div>
                      <div><span className="lbl">Yield</span><div style={{fontFamily:"var(--mono)",fontWeight:600}}>{f(yld,1)}%</div></div>
                      <div><span className="lbl">Polish Value</span><div style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--amber)"}}>{fd(p.tot)}</div></div>
                      <div><span className="lbl">Last Sold $/ct</span><div style={{fontFamily:"var(--mono)",fontWeight:600}}>{lastSold > 0 ? "$"+lastSold : "—"}</div></div>
                      <div><span className="lbl">Hot Size %</span><div style={{fontFamily:"var(--mono)",fontWeight:600,color: p.hotPct > 50 ? "var(--green)" : "var(--red)"}}>{f(p.hotPct,1)}%</div></div>
                    </div>

                    {/* Waterfall */}
                    <div style={{background:"#f8f9fb",borderRadius:6,padding:10,border:"1px solid var(--border)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:11,color:"var(--text2)"}}>Total Polish Value</span>
                        <span style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--amber)"}}>{fd(p.tot)}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:11,color:"var(--red)"}}>− Labour (${f(labour,0)}/ct × {f(p.rC,1)} cts)</span>
                        <span style={{fontFamily:"var(--mono)",fontWeight:600,color:"var(--red)"}}>−{fd(totalLabour)}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:11,color:"var(--text2)"}}>Net Value</span>
                        <span style={{fontFamily:"var(--mono)",fontWeight:600}}>{netValue > 0 ? fd(netValue) : "—"}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:11,color:"var(--text2)"}}>Net $/ct Rough (÷ {f(p.rC,1)} cts)</span>
                        <span style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)"}}>{netPerCt > 0 ? "$"+f(netPerCt,2) : "—"}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:11,color:"var(--red)"}}>× (1 − {f(profit,1)}% profit)</span>
                        <span style={{fontFamily:"var(--mono)",fontWeight:600,color:"var(--red)"}}>×{f(1 - profit/100,3)}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",marginTop:4,borderTop:"2px solid var(--border)"}}>
                        <span style={{fontSize:13,fontWeight:700,color:"var(--green)"}}>BID PRICE $/ct</span>
                        <span style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:18,color:"var(--green)"}}>{bid > 0 ? "$"+f(bid,0) : "—"}</span>
                      </div>
                      {lastSold > 0 && bid > 0 && <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
                        <span style={{fontSize:10,color:"var(--text3)"}}>vs Last Sold (${lastSold})</span>
                        <span style={{fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color: bid > lastSold ? "var(--red)" : "var(--green)"}}>
                          {bid > lastSold ? "↑" : "↓"} ${f(Math.abs(bid - lastSold),0)} ({(bid > lastSold ? "+" : "") + f((bid - lastSold)/lastSold*100,1)}%)
                        </span>
                      </div>}
                    </div>
                  </div>
                </div>);
            })}
          </div>

          {/* Bid Comparison Chart */}
          <div className="chart-wrap" style={{marginTop:14}}>
            <div className="chart-box" style={{flex:"1 1 100%"}}>
              <div className="chart-title">Bid Price vs Last Sold — All Parcels</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={PARCEL_DEFS.map((pDef, pi) => {
                  const p = allParcelPolish[pi]; const pcl = parcels[pi];
                  const roughPerCt = p.rC > 0 ? p.tot / p.rC : 0;
                  const bid = calcBid(p.tot, p.rC, getLabour(pi), getProfit(pi));
                  return { name: "#"+pcl.number+" "+pDef.type, bid: Math.round(bid), lastSold: parseFloat(pcl.lastSold) || 0, roughPerCt: Math.round(roughPerCt) };
                })} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e5ea" />
                  <XAxis dataKey="name" tick={{fontSize:10,fill:"#4b5060"}} />
                  <YAxis tick={{fontSize:10,fill:"#8690a2"}} tickFormatter={v => "$"+v} />
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="roughPerCt" name="Max $/ct (before costs)" fill="#94a3b8" radius={[4,4,0,0]} />
                  <Bar dataKey="lastSold" name="Last Sold $/ct" fill="#f59e0b" radius={[4,4,0,0]} />
                  <Bar dataKey="bid" name="Your Bid $/ct" fill="#16a34a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          </>;
        })()}

      </div>
    </div>
  );
}
