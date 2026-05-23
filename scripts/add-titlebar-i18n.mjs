import fs from "node:fs";
import path from "node:path";

const dir = "C:/Users/user/DEV/KKTerm/src/i18n/locales";

const translations = {
  "en.json": ["Minimize", "Maximize", "Restore", "Close"],
  "zh-CN.json": ["最小化", "最大化", "还原", "关闭"],
  "ja.json": ["最小化", "最大化", "元に戻す", "閉じる"],
  "ko.json": ["최소화", "최대화", "복원", "닫기"],
  "fr.json": ["Réduire", "Agrandir", "Restaurer", "Fermer"],
  "de.json": ["Minimieren", "Maximieren", "Wiederherstellen", "Schließen"],
  "es.json": ["Minimizar", "Maximizar", "Restaurar", "Cerrar"],
  "es-MX.json": ["Minimizar", "Maximizar", "Restaurar", "Cerrar"],
  "it.json": ["Riduci a icona", "Ingrandisci", "Ripristina", "Chiudi"],
  "pt-BR.json": ["Minimizar", "Maximizar", "Restaurar", "Fechar"],
  "vi.json": ["Thu nhỏ", "Phóng to", "Khôi phục", "Đóng"],
  "th.json": ["ย่อ", "ขยาย", "คืนค่า", "ปิด"],
  "id.json": ["Minimalkan", "Maksimalkan", "Pulihkan", "Tutup"],
};

for (const [file, [mi, ma, re, cl]] of Object.entries(translations)) {
  const fp = path.join(dir, file);
  let text = fs.readFileSync(fp, "utf8");
  if (text.includes('"titlebar"')) {
    console.log(`skip ${file} (already has titlebar)`);
    continue;
  }
  const block = `,\n    "titlebar": {\n      "minimize": "${mi}",\n      "maximize": "${ma}",\n      "restore": "${re}",\n      "close": "${cl}"\n    }`;
  const updated = text.replace(
    /("dontSleepStatusEnabled":\s*"[^"]*")(\s*\n\s*\})/,
    `$1${block}$2`,
  );
  if (updated === text) {
    console.error(`FAIL ${file}: anchor not matched`);
    continue;
  }
  fs.writeFileSync(fp, updated, "utf8");
  console.log(`patched ${file}`);
}
