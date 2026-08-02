# AGNOS Candidate Assignment

ระบบ Patient Information Form และ Staff Monitoring Interface แบบ Real-time สำหรับ AGNOS Candidate Assignment

## 1. ภาพรวมโปรเจกต์

โปรเจกต์นี้พัฒนาขึ้นสำหรับ AGNOS Candidate Assignment โดยแบ่งการทำงานออกเป็น 2 ส่วนหลัก:

- `Patient Form` สำหรับผู้ป่วยกรอก แก้ไข ล้างฟอร์ม และส่งข้อมูล
- `Staff View` สำหรับเจ้าหน้าที่ติดตามข้อมูลผู้ป่วยหลาย session แบบ Real-time

เมื่อผู้ป่วยกรอกข้อมูลใน `Patient Form` ระบบจะส่งการเปลี่ยนแปลงผ่าน `Socket.IO` ไปยัง `Express + Socket.IO` server และ `Staff View` จะเห็นข้อมูลอัปเดตโดยไม่ต้อง refresh หน้าเว็บ

สถาปัตยกรรมปัจจุบัน:

- Frontend: `Next.js 15` App Router, `React 19`, `TypeScript`, `Tailwind CSS v4`
- Realtime server: `Express.js` + `Socket.IO Server`
- Client realtime: `socket.io-client`
- Forms: `React Hook Form` + `Zod`
- State: `Zustand`
- Storage: in-memory session store ใน `server/index.ts`
- Database: ยังไม่มี persistent database

ระบบรองรับ responsive layout สำหรับ mobile, tablet และ desktop แต่โปรเจกต์นี้ยังเป็น candidate assignment ไม่ใช่ระบบโรงพยาบาล production แบบสมบูรณ์

## 2. ลิงก์โปรเจกต์

GitHub Repository:

- `https://github.com/TAWANKAN47/Candidate-Assignment-Agnos`

ลิงก์สำหรับทดสอบระบบ:

- Live Application: `https://candidate-assignment-agnos.vercel.app`
- Patient Form: `https://candidate-assignment-agnos.vercel.app`
- Staff View: `https://candidate-assignment-agnos.vercel.app/staff`
- Realtime Server: `https://candidate-assignment-agnos-production.up.railway.app`
- Health Check: `https://candidate-assignment-agnos-production.up.railway.app/health`

## 3. วิธีติดตั้งและรันในเครื่อง

ติดตั้ง dependencies:

```bash
npm install
```

รัน Realtime server:

```bash
npm run server:dev
```

รัน Frontend:

```bash
npm run dev
```

เปิดใช้งาน:

- Patient Form: `http://localhost:3000`
- Patient Form route สำรอง: `http://localhost:3000/patient`
- Staff View: `http://localhost:3000/staff`
- Realtime health check: `http://localhost:4000/health`

Environment variables ที่ใช้:

```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
FRONTEND_ORIGIN=http://localhost:3000
PORT=4000
```

ถ้าไม่กำหนด `NEXT_PUBLIC_SOCKET_URL` client จะใช้ `http://localhost:4000` เป็นค่า default และถ้าไม่กำหนด `FRONTEND_ORIGIN` server จะอนุญาต `http://localhost:3000`

## 4. Requirement หลักจาก Assignment

### Patient Form

หน้า `/` และ `/patient` แสดง `PatientForm` ตัวเดียวกัน ผู้ป่วยไม่ต้องเลือก workflow ระหว่าง Patient และ Staff

ข้อมูลในฟอร์มถูกจัดเป็น 3 section:

1. Patient Information
2. Contact Information
3. Emergency Contact

ข้อมูลที่รองรับ:

- First Name, Middle Name, Last Name
- Date of Birth พร้อม validation ไม่ให้เป็นวันในอนาคต
- Gender แบบ enum: `male`, `female`, `other`, `prefer-not-to-say`
- Preferred Language แบบ enum: `th`, `en`, `zh`, `ja`, `other`
- Phone Number แบบ international phone แยก `phoneCountryCode`, `phoneNationalNumber`, `phone`
- Email
- Structured Thai Address พร้อม `address`, `structuredAddress`
- Nationality
- Religion
- Emergency Contact Name
- Emergency Contact Phone
- Emergency Contact Relationship

หลัง submit สำเร็จ ฟอร์มจะถูกแทนด้วย success state และผู้ป่วยสามารถกด `Register another patient` เพื่อสร้าง `Session ID` ใหม่โดยไม่ทับ session เดิม

### Staff View

หน้า `/staff` เป็น workflow แยกสำหรับเจ้าหน้าที่ ไม่มีปุ่ม Staff Portal ในหน้า Patient

Staff View แสดง:

- รายการ patient sessions
- summary cards
- patient details ตามโครงสร้าง 3 section เดียวกับ Patient Form
- Activity Timeline
- real-time status
- Print / Save as PDF ผ่าน native browser print
- ปุ่มแก้ไขบาง field และลบ session ผ่าน `staff:update` และ `staff:delete`

สถานะ session ที่ใช้:

- `waiting`
- `actively-filling`
- `inactive`
- `submitted`

## 5. Bonus Features

ฟีเจอร์ที่เพิ่มจาก requirement หลักและมีอยู่ใน codebase:

- Multi-patient sessions ด้วย `Session ID` รูปแบบ `AGN-XXXXXX`
- Socket.IO room แยกตาม patient session เช่น `patient:<sessionId>`
- Staff lobby room: `staff:lobby`
- Activity Timeline แสดง newest first และจำกัดจำนวนรายการ
- Timeline deduplication ผ่าน `addOrUpdateTimeline()` ใน `server/timeline.ts`
- Inactivity status update ทุก 5 วินาที โดยใช้ threshold 30 วินาที
- Patient submit lock ป้องกันการแก้ไขหลังส่งข้อมูล
- Server protection สำหรับ submitted session ผ่าน `canModifyPatientSession()`
- Server-side payload whitelist และ validation ด้วย `Zod`
- Structured Thai Address selector แบบ cascading
- Local Thai address dataset ใน `data/thai-addresses.json`
- Bilingual UI สำหรับ Patient และ Staff ผ่าน locale `th` / `en`
- Locale persistence ด้วย `localStorage` key `agnos-locale`
- Accessible searchable combobox ใน `components/ui/combobox.tsx`
- International phone normalization และ display formatter
- Staff print output ที่ซ่อน timeline, session list, search, buttons และ language switch

## 6. Project Structure

โครงสร้างหลักของโปรเจกต์:

```text
app/
  page.tsx
  patient/
    page.tsx
    patient-form.tsx
    patient-form.test.tsx
  staff/
    page.tsx
    staff-view.tsx
    staff-i18n.ts
    store.ts

components/
  shared/
    LanguageSwitcher.tsx
  ui/
    button.tsx
    combobox.tsx
    input.tsx
    select.tsx
    textarea.tsx
  status-pill.tsx

data/
  thai-addresses.json
  thai-addresses-source.md
  thai-addresses-license.txt

hooks/
  useLocale.ts

i18n/
  locale.ts
  translations.ts

lib/
  events.ts
  patient-schema.ts
  patient-values.ts
  session.ts
  socket.ts
  thai-address.ts
  utils.ts

server/
  index.ts
  patient-update.ts
  session-protection.ts
  timeline.ts
```

ไฟล์สำคัญ:

- `app/page.tsx`: entry point หลัก แสดง `PatientForm`
- `app/patient/page.tsx`: route สำรองของ Patient Form
- `app/staff/page.tsx`: Staff route
- `app/patient/patient-form.tsx`: UI และ client workflow ของผู้ป่วย
- `app/staff/staff-view.tsx`: Staff dashboard, timeline, print และ edit/delete controls
- `lib/patient-schema.ts`: client-side form schema
- `lib/patient-values.ts`: enum, phone formatter, structured address formatter และ server validation schema
- `server/index.ts`: Express, Socket.IO events และ in-memory session store
- `server/patient-update.ts`: whitelist และ apply update logic
- `server/session-protection.ts`: ป้องกัน submitted session ถูกแก้ไข
- `server/timeline.ts`: timeline limit และ deduplication

## 7. Responsive UX/UI

Patient Form ใช้ layout แบบอ่านจากบนลงล่าง เพื่อให้ผู้ป่วยกรอกข้อมูลได้ตรงงานหลัก:

1. อ่านคำอธิบาย
2. กรอกข้อมูล
3. Submit

หน้า Patient จึงไม่แสดง technical status ถาวร เช่น session code, connected badge หรือ sync banner ระหว่างระบบทำงานปกติ แต่จะแสดงสถานะเฉพาะเมื่อผู้ป่วยต้องรับรู้ เช่น reconnecting หรือ error

Staff View ใช้ layout ที่ต่างออกไปเพราะเป็น monitoring workflow:

- Desktop: session list, patient details และ activity timeline แยกเป็น 3 column
- Tablet: layout ยืดหยุ่นตามพื้นที่
- Mobile: content เรียงเป็น single column เพื่อลด horizontal scrolling

Activity Timeline ใน desktop/tablet ถูกทำให้ scroll ภายใน panel เพื่อไม่ให้ timeline items ทำให้ทั้งหน้าสูงเกิน viewport

## 8. Component Architecture

แนวทาง component ปัจจุบัน:

- `PatientForm` ใช้ `React Hook Form` ร่วมกับ `createPatientSchema(locale)`
- field labels, validation messages และข้อความ UI ของ Patient อยู่ใน `i18n/translations.ts`
- Staff translations และ display helpers อยู่ใน `app/staff/staff-i18n.ts`
- `useLocale()` จัดการ locale กลางและเก็บค่าใน `localStorage`
- `LanguageSwitcher` ถูก reuse ทั้ง Patient และ Staff
- dropdown และ searchable combobox ใช้ visual style ร่วมจาก `components/ui/select.tsx`
- `Combobox` รองรับ searchable และ non-searchable mode พร้อม ARIA attributes
- structured address option helpers อยู่ใน `lib/thai-address.ts`
- phone normalization และ formatter อยู่ใน `lib/patient-values.ts`
- Staff ใช้ `Zustand` store ใน `app/staff/store.ts` เพื่อจัดการ session list, selected session และ snapshot

UI ใช้ `Lucide React` icons เช่น `HeartPulse`, `UserRound`, `Phone`, `Ambulance`, `Pencil`, `Trash2`, `Printer` โดยไม่ใช้อิโมจิเป็นส่วนของ interface หลัก

## 9. Real-time Synchronization

Socket.IO event names ที่มีใน `lib/events.ts`:

Client to server:

- `patient:join`
- `staff:join`
- `session:selected`
- `patient:update`
- `staff:update`
- `staff:delete`
- `patient:submit`
- `patient:clear`

Server to client:

- `session:created`
- `session:list`
- `session:summary-updated`
- `session:snapshot`
- `session:unavailable`
- `patient:update`
- `patient:status`
- `patient:submit`
- `patient:clear`
- `staff:delete`

Flow หลัก:

```text
Patient Form
  -> React Hook Form
  -> Zod validation
  -> socket.io-client
  -> Express + Socket.IO Server
  -> in-memory Session Map
  -> Socket.IO room
  -> Staff View
```

การแยก session:

- Patient join จะเข้า room `patient:<sessionId>`
- Staff join จะเข้า room `staff:lobby`
- Staff เลือก session ผ่าน `session:selected`
- Server ส่ง snapshot ของ session ที่เลือกกลับไปให้ Staff
- `session:list` และ `session:summary-updated` ใช้สำหรับ sync รายการ session ใน Staff View

Server ตรวจ payload ก่อน update ด้วย `patientUpdatePayloadSchema`, `serverPatientDataSchema` และ `.strict()` เพื่อ reject field ที่ไม่ได้อยู่ใน whitelist

## 10. วิธีทดสอบ Build และ Deploy

ตรวจ TypeScript:

```bash
npm run typecheck
```

ตรวจ ESLint:

```bash
npm run lint
```

รันทดสอบ:

```bash
npm run test
```

Production build:

```bash
npm run build
```

Scripts ใน `package.json`:

```text
npm run dev
npm run server:dev
npm run build
npm run start
npm run server:start
npm run typecheck
npm run lint
npm run test
```

Deployment ที่ตั้งใจใช้:

- Frontend: Vercel
- Realtime Server: Railway

ค่าที่ควรกำหนดตอน deploy:

- Frontend ต้องมี `NEXT_PUBLIC_SOCKET_URL` ชี้ไปที่ Railway realtime server
- Realtime server ต้องมี `FRONTEND_ORIGIN` ชี้ไปที่ Vercel frontend origin
- Railway สามารถใช้ `PORT` จาก platform หรือ fallback เป็น `4000`

## 11. Thai Address Dataset

ข้อมูลที่อยู่ไทยถูกเก็บ local ที่:

- `data/thai-addresses.json`

Source metadata อยู่ที่:

- `data/thai-addresses-source.md`
- `data/thai-addresses-license.txt`

Dataset source:

- `https://github.com/thailand-geography-data/thailand-geography-json`
- Source commit: `b8b3fb91c7df1129ff5b43cb46f7fcffadd2156b`
- License: `MIT`
- Local record count: `7,436` subdistrict-level records

ระบบ import dataset ตอน build ผ่าน `lib/thai-address.ts` จึงไม่ต้องเรียก remote API ตอน runtime

## 12. ข้อจำกัดของระบบ

ข้อจำกัดที่มีอยู่จริงใน codebase ปัจจุบัน:

- ข้อมูล session เก็บใน memory ของ Node process เท่านั้น
- restart server แล้วข้อมูล session จะหาย
- ยังไม่มี persistent database
- ยังไม่มี authentication สำหรับ Staff View
- ยังไม่มี role-based authorization
- ยังไม่มี audit log ถาวร
- `staff:update` ใช้ `window.prompt` สำหรับแก้ไข field บางรายการ ไม่ใช่ modal/form editor เต็มรูปแบบ
- phone validation รองรับเฉพาะประเทศที่กำหนดใน `phoneCountryCodes`
- structured address dataset รองรับข้อมูลไทยตาม dataset local ที่แนบไว้
- ระบบนี้ไม่ได้ออกแบบหรือรับรองว่าเป็น HIPAA-compliant, medically certified หรือ fully secure

## 13. Tech Stack

Frontend:

- `Next.js 15` App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`

UI:

- local `shadcn/ui` style primitives ใน `components/ui`
- `Radix UI` ผ่าน `@radix-ui/react-slot`
- `Lucide React`

Forms:

- `React Hook Form`
- `Zod`

Realtime:

- `Socket.IO`
- `socket.io-client`

Server:

- `Express.js`
- `Socket.IO Server`

State:

- `Zustand`

Utilities:

- `clsx`
- `tailwind-merge`
- `date-fns`

Print:

- Native Browser Print
- CSS Print Media ใน `app/globals.css`

Testing:

- `Vitest`
- `React Testing Library`

Code Style:

- `ESLint`
- `Prettier`
