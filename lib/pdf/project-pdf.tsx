import { Circle, Document, Image, Line, Page, Path, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { Diagram, Tone } from "@/lib/diagram/types";
import { TONE_HEX } from "@/lib/diagram/types";
import { formatDate } from "@/lib/dates";
import { formatRow, getCalcById, inputRows } from "@/lib/present/registry";
import type { CalcId, Values } from "@/lib/present/types";

export type PdfCalculation = { calculator: CalcId; input: Values; output: unknown };
export type PdfData = {
  project: { name: string; client_name: string | null; notes: string | null };
  rooms: { name: string; calculations: PdfCalculation[] }[];
  branding: { pro: boolean; companyName: string | null; preparedBy: string | null; logoDataUri: string | null };
  generatedAt: Date;
};

const C = {
  ink: "#162033",
  muted: "#55637A",
  line: "#2F5DA8",
  accent: "#0E8C7F",
  warn: "#8F5500",
  border: "#D6DEEA",
  sunken: "#F3F5F9",
};

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 40, fontFamily: "DejaVu", fontSize: 9, color: C.ink, lineHeight: 1.4 },
  display: { fontFamily: "SpaceGrotesk", fontWeight: 700 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.muted, borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 6 },
  watermark: { position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", fontFamily: "SpaceGrotesk", fontWeight: 700, fontSize: 54, color: "#2F5DA8", opacity: 0.09, transform: "rotate(-30deg)" },
  roomTitle: { fontFamily: "SpaceGrotesk", fontWeight: 700, fontSize: 18, color: C.line, marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.line },
  calc: { marginBottom: 18 },
  calcTitle: { fontFamily: "SpaceGrotesk", fontWeight: 600, fontSize: 12.5, marginBottom: 6 },
  cols: { flexDirection: "row", gap: 14 },
  col: { flex: 1 },
  label: { fontSize: 7.5, color: C.muted, marginBottom: 3 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5, borderBottomWidth: 0.5, borderBottomColor: C.border, gap: 8 },
  rowLabel: { color: C.muted, flex: 1 },
  rowValue: { textAlign: "right", flex: 1 },
  primary: { flexDirection: "row", flexWrap: "wrap", gap: 18, marginBottom: 8, padding: 8, backgroundColor: C.sunken },
  primaryValue: { fontFamily: "SpaceGrotesk", fontWeight: 700, fontSize: 16, color: C.accent },
  diagram: { marginVertical: 8, borderWidth: 0.5, borderColor: C.border },
  small: { fontSize: 7.5, color: C.muted },
  warn: { fontSize: 8, color: C.warn, marginTop: 3 },
});

const hex = (t: Tone | "none" | undefined, fallback: Tone) => (t === "none" ? "none" : TONE_HEX[t ?? fallback]);

function PdfDiagram({ d, width }: { d: Diagram; width: number }) {
  return (
    <Svg width={width} height={(width * d.height) / d.width} viewBox={`0 0 ${d.width} ${d.height}`}>
      <Rect x={0} y={0} width={d.width} height={d.height} fill="#FFFFFF" />
      {d.shapes.map((sh, i) => {
        const dash = "dash" in sh && sh.dash ? "5 4" : undefined;
        switch (sh.kind) {
          case "line":
            return <Line key={i} x1={sh.x1} y1={sh.y1} x2={sh.x2} y2={sh.y2} stroke={hex(sh.tone, "line")} strokeWidth={sh.sw ?? 1} strokeDasharray={dash} />;
          case "rect":
            return <Rect key={i} x={sh.x} y={sh.y} width={sh.w} height={sh.h} stroke={sh.sw === 0 ? "none" : hex(sh.tone, "line")} strokeWidth={sh.sw ?? 1} fill={hex(sh.fill ?? "none", "surface")} fillOpacity={sh.fillOpacity ?? 1} strokeDasharray={dash} />;
          case "circle":
            return <Circle key={i} cx={sh.cx} cy={sh.cy} r={sh.r} stroke={hex(sh.tone, "line")} strokeWidth={sh.sw ?? 1} fill={hex(sh.fill ?? "none", "surface")} fillOpacity={sh.fillOpacity ?? 1} strokeDasharray={dash} />;
          case "path":
            return <Path key={i} d={sh.d} stroke={hex(sh.tone, "line")} strokeWidth={sh.sw ?? 1} fill={hex(sh.fill ?? "none", "surface")} fillOpacity={sh.fillOpacity ?? 1} strokeDasharray={dash} />;
          case "text":
            return (
              <Text key={i} x={sh.x} y={sh.y} fill={hex(sh.tone, "text")} textAnchor={sh.anchor ?? "start"} style={{ fontSize: sh.size ?? 11, fontFamily: "DejaVu", fontWeight: sh.bold ? 700 : 400 }}>
                {sh.text}
              </Text>
            );
        }
      })}
    </Svg>
  );
}

function CalcBlock({ c }: { c: PdfCalculation }) {
  const def = getCalcById(c.calculator);
  if (!def) return null;
  const summary = def.summarize(c.input, c.output, "metric");
  const primary = summary.results.filter((r) => r.primary);
  const rest = summary.results.filter((r) => !r.primary);
  const diagram = def.diagram?.(c.input, c.output, "metric") ?? null;
  const fmt = (r: (typeof summary.results)[number]) => {
    const f = formatRow(r, "metric");
    return `${f.value}${f.unit ? ` ${f.unit}` : ""}${r.estimate ? " (Estimasi)" : ""}`;
  };
  return (
    <View style={s.calc}>
      <View wrap={false}>
        <Text style={s.calcTitle}>{def.title}</Text>
        <View style={s.primary}>
          {primary.map((r) => (
            <View key={r.label}>
              <Text style={s.label}>{r.label}{r.estimate ? " (Estimasi)" : ""}</Text>
              <Text style={[s.primaryValue, r.tone === "warn" ? { color: C.warn } : {}]}>
                {formatRow(r, "metric").value} <Text style={{ fontSize: 9, color: C.muted }}>{formatRow(r, "metric").unit}</Text>
              </Text>
            </View>
          ))}
        </View>
        {summary.warnings.map((w) => (
          <Text key={w} style={s.warn}>Peringatan: {w}</Text>
        ))}
        {diagram ? (
          <View style={s.diagram}>
            <PdfDiagram d={diagram} width={513} />
          </View>
        ) : null}
      </View>
      <View style={s.cols}>
        <View style={s.col}>
          <Text style={s.label}>Input</Text>
          {inputRows(def, c.input, "metric").map((r) => (
            <View key={r.label} style={s.row} wrap={false}>
              <Text style={s.rowLabel}>{r.label}</Text>
              <Text style={s.rowValue}>{r.value}</Text>
            </View>
          ))}
        </View>
        <View style={s.col}>
          <Text style={s.label}>Hasil</Text>
          {rest.map((r) => (
            <View key={`${r.section ?? ""}${r.label}`} style={s.row} wrap={false}>
              <Text style={s.rowLabel}>{r.section ? `${r.section}: ` : ""}{r.label}</Text>
              <Text style={s.rowValue}>{fmt(r)}</Text>
            </View>
          ))}
        </View>
      </View>
      <View wrap={false} style={{ marginTop: 8 }}>
        <Text style={s.label}>Rumus</Text>
        {def.formulas.map((f) => (
          <Text key={f} style={s.small}>• {f}</Text>
        ))}
        {def.note ? <Text style={[s.small, { marginTop: 3 }]}>{def.note}</Text> : null}
      </View>
    </View>
  );
}

function Chrome({ data }: { data: PdfData }) {
  return (
    <>
      {!data.branding.pro ? (
        <Text fixed style={s.watermark}>
          AVCalc versi gratis
        </Text>
      ) : null}
      <View fixed style={s.footer}>
        <Text>
          {data.project.name}
          {data.branding.pro && data.branding.companyName ? `  |  ${data.branding.companyName}` : "  |  Dibuat dengan AVCalc"}
        </Text>
        <Text render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`} />
      </View>
    </>
  );
}

export function ProjectPdf({ data }: { data: PdfData }) {
  const { project, rooms, branding } = data;
  const total = rooms.reduce((n, r) => n + r.calculations.length, 0);
  return (
    <Document title={project.name} author={branding.pro ? (branding.companyName ?? undefined) : "AVCalc"} creator="AVCalc" language="id">
      <Page size="A4" style={s.page}>
        <Chrome data={data} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 150 }}>
          {branding.pro && branding.logoDataUri ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={branding.logoDataUri} style={{ maxWidth: 160, maxHeight: 60, objectFit: "contain" }} />
          ) : (
            <Text style={[s.display, { fontSize: 16, color: C.line }]}>{branding.pro && branding.companyName ? branding.companyName : "AVCalc"}</Text>
          )}
          <Text style={s.small}>{formatDate(data.generatedAt)}</Text>
        </View>
        <Text style={[s.small, { color: C.line, marginBottom: 6 }]}>Kalkulasi desain ruang AV</Text>
        <Text style={[s.display, { fontSize: 32, lineHeight: 1.1, marginBottom: 12 }]}>{project.name}</Text>
        {project.client_name ? <Text style={{ fontSize: 13, marginBottom: 4 }}>Klien: {project.client_name}</Text> : null}
        <Text style={{ fontSize: 10, color: C.muted }}>
          {rooms.length} ruang, {total} kalkulasi
          {branding.preparedBy ? `. Disiapkan oleh ${branding.preparedBy}` : ""}
        </Text>
        <View style={{ marginTop: 40, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }}>
          {rooms.map((r) => (
            <View key={r.name} style={s.row}>
              <Text>{r.name}</Text>
              <Text style={{ color: C.muted }}>
                {r.calculations.map((c) => getCalcById(c.calculator)?.navTitle).filter(Boolean).join(", ") || "Belum ada kalkulasi"}
              </Text>
            </View>
          ))}
        </View>
        {project.notes ? (
          <View style={{ marginTop: 24 }}>
            <Text style={s.label}>Catatan</Text>
            <Text>{project.notes}</Text>
          </View>
        ) : null}
      </Page>

      {rooms.map((room) => (
        <Page key={room.name} size="A4" style={s.page}>
          <Chrome data={data} />
          <Text style={s.roomTitle}>{room.name}</Text>
          {room.calculations.length === 0 ? <Text style={s.small}>Belum ada kalkulasi di ruang ini.</Text> : null}
          {room.calculations.map((c, i) => (
            <CalcBlock key={i} c={c} />
          ))}
        </Page>
      ))}

      <Page size="A4" style={s.page}>
        <Chrome data={data} />
        <Text style={s.roomTitle}>Catatan estimasi</Text>
        {[
          "Nilai bertanda (Estimasi) adalah perkiraan berdasarkan rule of thumb, bukan hasil pengukuran. Gunakan sebagai titik awal desain.",
          "Ukuran layar memakai rule of thumb 4/6/8 (ADM/BDM/pasif). Untuk desain final, gunakan standar AVIXA DISCAS.",
          "Jarak pandang LED (pitch × 1 dan pitch × 3) adalah perkiraan; cek rekomendasi pabrikan untuk modul yang dipilih.",
          "Kebutuhan lumen proyektor dihitung dari cahaya ambien, target kontras, luas layar, dan gain. Ukur cahaya ambien di lokasi dan sisihkan cadangan untuk penurunan kecerahan.",
          "Cakupan speaker plafon dihitung secara geometris dari sudut dispersi nominal pada ketinggian telinga, tanpa memperhitungkan akustik ruang.",
          "Semua ukuran dalam satuan metrik. Verifikasi dengan datasheet perangkat sebelum pengadaan dan instalasi.",
        ].map((t) => (
          <Text key={t} style={{ marginBottom: 6 }}>• {t}</Text>
        ))}
      </Page>
    </Document>
  );
}
