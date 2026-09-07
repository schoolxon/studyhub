# 13 — Notification Templates (WhatsApp + SMS)

**Zaroori:** WhatsApp Business API pe template pehle Meta se approve karani padti hai.
SMS ke liye DLT registration + template approval chahiye. Ye process 3-10 din leta hai —
Phase 0 me hi submit kar do.

Variables `{{1}}, {{2}}` format me (Meta requirement).

---

## 1. Welcome (admission ke baad)

**Hindi**
```
नमस्ते {{1}} 🙏

{{2}} में आपका स्वागत है!

📍 सीट नंबर: {{3}}
🕐 शिफ्ट: {{4}}
📅 वैध तिथि: {{5}} तक

किसी भी सहायता के लिए संपर्क करें: {{6}}
```
Variables: name, library_name, seat_no, shift_name, end_date, contact

**English**
```
Hello {{1}} 🙏

Welcome to {{2}}!

📍 Seat: {{3}}
🕐 Shift: {{4}}
📅 Valid till: {{5}}

For any help, contact: {{6}}
```

---

## 2. Payment Receipt

**Hindi**
```
धन्यवाद {{1}} ✅

राशि प्राप्त हुई: ₹{{2}}
रसीद नंबर: {{3}}
भुगतान का तरीका: {{4}}
शेष राशि: ₹{{5}}
सदस्यता वैध: {{6}} तक

रसीद देखें: {{7}}

- {{8}}
```
Variables: name, amount, receipt_no, mode, balance, valid_till, receipt_url, library_name

---

## 3. Fee Reminder — 5 days before

**Hindi**
```
नमस्ते {{1}},

आपकी लाइब्रेरी सदस्यता {{2}} को समाप्त हो रही है।

💺 सीट: {{3}}
💰 नवीनीकरण राशि: ₹{{4}}

सीट सुरक्षित रखने के लिए समय पर नवीनीकरण करें।

भुगतान करें: {{5}}

- {{6}}
```

---

## 4. Fee Due — on expiry day

**Hindi**
```
{{1}}, आपकी सदस्यता आज समाप्त हो रही है ⏰

💰 राशि: ₹{{2}}
💺 सीट: {{3}}

कृपया आज ही नवीनीकरण करें, अन्यथा सीट किसी और को दे दी जाएगी।

भुगतान: {{4}}

- {{5}}
```

---

## 5. Overdue — 3 days after (student + guardian)

**Hindi**
```
{{1}}, आपकी सदस्यता {{2}} को समाप्त हो चुकी है ⚠️

बकाया राशि: ₹{{3}}
सीट {{4}} अभी {{5}} दिन तक आपके लिए सुरक्षित है।

इसके बाद सीट किसी और को दे दी जाएगी।

तुरंत भुगतान करें: {{6}}

- {{7}}
```

---

## 6. Membership Expired / Seat Released

```
{{1}}, आपकी सीट {{2}} अब जारी कर दी गई है।

दोबारा जुड़ना चाहें तो संपर्क करें: {{3}}
आपकी पढ़ाई के लिए शुभकामनाएं! 📚

- {{4}}
```

---

## 7. Daily Summary (owner ko, raat 9 बजे)

```
📊 {{1}} — {{2}} की रिपोर्ट

💰 आज की वसूली: ₹{{3}}
👥 नए एडमिशन: {{4}}
🔄 नवीनीकरण: {{5}}
⚠️ कुल बकाया: ₹{{6}} ({{7}} छात्र)
📅 अगले 7 दिन में समाप्त: {{8}}
🪑 सीट occupancy: {{9}}%
✅ आज उपस्थित: {{10}}

विस्तार देखें: {{11}}
```

---

## 8. Absent Alert (owner ko)

```
⚠️ ये छात्र {{1}} दिन से नहीं आए:

{{2}}

हो सकता है ये छोड़ने वाले हों — एक कॉल कर लें।
```
Variable {{2}} = newline-separated list (name — seat — days)

---

## 9. Seat Available (waiting list ko)

```
खुशखबरी {{1}}! 🎉

{{2}} में {{3}} शिफ्ट की सीट खाली हो गई है।

💰 मासिक शुल्क: ₹{{4}}

पहले आओ पहले पाओ — आज ही संपर्क करें: {{5}}
```

---

## 10. Birthday

```
जन्मदिन मुबारक हो {{1}}! 🎂

{{2}} परिवार की ओर से आपको ढेर सारी शुभकामनाएं।
आपकी मेहनत रंग लाए! 📚✨
```

---

## 11. Bulk Announcement (template with free text)

```
📢 सूचना — {{1}}

{{2}}

- {{3}}
```
Meta ke rules ke hisaab se free-text ke liye "Utility" ya "Marketing" category template
banani padegi. Marketing category pe opt-out mandatory hai.

---

## 12. Monthly Attendance Report (parent ko)

```
{{1}} की {{2}} महीने की उपस्थिति रिपोर्ट:

📅 कुल दिन उपस्थित: {{3}}/{{4}}
⏱️ कुल घंटे: {{5}}
📊 औसत रोज़: {{6}} घंटे

- {{7}}
```

---

## 13. SaaS side — tenant ko (tumhare messages)

**Trial ending (3 days)**
```
{{1}}, आपका StudyHub ट्रायल {{2}} दिन में खत्म हो रहा है।

अब तक आपने {{3}} छात्र जोड़े और ₹{{4}} की वसूली ट्रैक की।

प्लान चुनें (₹499/माह से): {{5}}
```

**Payment failed (dunning)**
```
{{1}}, आपका StudyHub भुगतान नहीं हो पाया।

राशि: ₹{{2}}
कृपया {{3}} तक भुगतान करें ताकि सेवा जारी रहे।

भुगतान: {{4}}
```

---

## Implementation notes

### Meta template approval
In templates me emoji hain — Meta aksar reject karta hai. Submit **bina emoji**
pehle; approve ke baad session messages me emoji optional. DLT SMS: exact match,
emoji mat daalna.

### Dedupe (bahut zaroori)
Har notification ka `dedupe_key` banao:
```
dedupe_key = `${student_id}:${template_code}:${date}`
```
Unique index isse duplicate spam rokega. Ek student ko ek din me ek hi reminder jaye,
chahe cron 3 baar chal jaye.

### Rate limiting
- WhatsApp: Meta ka tier system (1K/10K/100K per day). Queue me throttle karo.
- SMS: DLT ka rate limit, provider ke hisaab se
- Bulk broadcast: batch me bhejo, 10-20 per second

### Quiet hours
Raat 9 PM se subah 8 AM tak koi message nahi (owner ka daily summary exception).
Students irritate ho jaate hain aur block kar dete hain.

### Opt-out
Marketing messages me "STOP likh kar bhejein" option. Student ne opt-out kiya to
`students.notification_opt_out = true` — transactional (receipt, expiry) fir bhi bhejo,
promotional nahi.

### Language selection
```
language = student.preferred_language ?? tenant.language ?? 'hi'
```
Chhote sheher me Hindi default rakho, metro me English.

### Fallback chain
```
WhatsApp bhejo → 5 min me delivered nahi hua ya failed → SMS bhejo
```
WhatsApp sasta hai (₹0.10-0.80), SMS mehenga (₹0.20) par reliable.

### Cost tracking
Har send pe `credit_ledger` me entry. Owner ko dashboard pe balance dikhao.
Credits khatam hone pe:
- Transactional (receipt, expiry) → phir bhi bhejo, negative balance allow karo (chhoti
  limit tak) — warna business ruk jayega aur wo tumhe blame karega
- Promotional → block karo, top-up prompt dikhao
