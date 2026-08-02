# AGNOS Candidate Assignment
## ระบบลงทะเบียนผู้ป่วยและหน้าจอ Staff แบบ Real-time

---

# ภาพรวมโครงการ (Project Overview)

โปรเจกต์นี้เป็นระบบลงทะเบียนผู้ป่วย (Patient Registration) และหน้าจอติดตามข้อมูลสำหรับเจ้าหน้าที่ (Staff View) ที่พัฒนาขึ้นตามโจทย์ Candidate Assignment ของ AGNOS

ระบบถูกออกแบบให้ผู้ป่วยสามารถกรอกข้อมูลผ่านแบบฟอร์ม และข้อมูลทั้งหมดจะถูกอัปเดตแบบ Real-time ไปยังหน้าจอของเจ้าหน้าที่ผ่าน Socket.IO โดยไม่ต้อง Refresh หน้าเว็บ

นอกจากนี้ยังเพิ่มฟีเจอร์เพื่อยกระดับประสบการณ์ใช้งาน (UX) และคุณภาพของข้อมูล เช่น

- รองรับหลาย Session พร้อมกัน (Multi-patient Sessions)
- ระบบที่อยู่ประเทศไทยแบบโครงสร้าง (Structured Thai Address)
- รองรับภาษาไทยและภาษาอังกฤษ
- แสดงสถานะผู้ป่วยแบบ Real-time
- พิมพ์หรือบันทึกข้อมูลเป็น PDF

---

# คุณสมบัติตามโจทย์ (Assignment Requirements)

## Patient Form

รองรับการกรอกข้อมูล

- ชื่อ
- ชื่อกลาง
- นามสกุล
- วันเกิด
- เพศ
- เบอร์โทรศัพท์
- Email
- ที่อยู่
- ภาษาที่ต้องการ
- สัญชาติ
- ศาสนา
- ผู้ติดต่อฉุกเฉิน
- ความสัมพันธ์
- เบอร์โทรผู้ติดต่อฉุกเฉิน (Bonus)

รองรับ

- Required Validation
- Email Validation
- Phone Validation
- Date Validation
- Responsive Design

---

## Staff View

แสดงข้อมูลผู้ป่วยแบบ Real-time

สามารถดู

- รายชื่อผู้ป่วยทั้งหมด
- สถานะผู้ป่วย
- ข้อมูลผู้ป่วย
- ประวัติการแก้ไข
- เวลาที่อัปเดตล่าสุด

รองรับ

- Active
- Inactive
- Submitted

---

# Bonus Features

โปรเจกต์นี้เพิ่มความสามารถจาก Requirement ดังนี้

Multi-patient Sessions

รองรับผู้ป่วยหลายคนพร้อมกันโดยไม่ชนกัน

ใช้ Session ID และ Socket.IO Room แยกข้อมูลของแต่ละผู้ป่วย

---

Thai / English Language

รองรับการสลับภาษา

- ไทย
- English

โดยข้อมูลยังคงเดิมไม่ถูกล้าง

---

Structured Thai Address

จาก Address แบบข้อความ

ปรับเป็น

- บ้านเลขที่ / ถนน
- จังหวัด
- อำเภอ / เขต
- ตำบล / แขวง
- รหัสไปรษณีย์

พร้อม

- Searchable Combobox
- Auto Postal Code
- Cascading จังหวัด → อำเภอ → ตำบล

เพื่อให้ข้อมูลมีความถูกต้องมากขึ้น

---

Activity Timeline

Staff สามารถเห็น

- การเปลี่ยนแปลงข้อมูล
- เวลาที่แก้ไข
- ฟิลด์ที่เปลี่ยน

แบบ Real-time

---

Changed Field Highlight

เมื่อข้อมูลมีการเปลี่ยน

Staff จะเห็นการ Highlight เฉพาะฟิลด์นั้น

---

Print / Save as PDF

Staff สามารถพิมพ์หรือบันทึกข้อมูลผู้ป่วยได้

---

# Technology Stack

## Frontend

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Radix UI
- shadcn/ui
- Lucide React

## Form

- React Hook Form
- Zod

## State Management

- Zustand

## Realtime

- Express
- Socket.IO
- socket.io-client

## Utility

- date-fns
- clsx
- tailwind-merge

## Testing

- Vitest
- React Testing Library

---

# โครงสร้างโปรเจกต์

```
app/
    patient/
    staff/

components/
    patient/
    staff/
    ui/

hooks/

lib/

server/

types/

data/
```

โดยแบ่งหน้าที่ออกเป็น

- UI Components
- Validation
- Socket
- Utilities
- Address Data
- Server

อย่างชัดเจน

---

# การทำงานของระบบ (Architecture)

```
Patient

↓

React Hook Form

↓

Validation (Zod)

↓

Socket.IO Client

↓

Express + Socket.IO Server

↓

Session Store

↓

Socket Room

↓

Staff View
```

เมื่อผู้ป่วยกรอกข้อมูล

↓

ข้อมูลถูก Validate

↓

ส่งผ่าน Socket.IO

↓

Server อัปเดต Session

↓

Broadcast ไปยัง Staff

↓

Staff เห็นข้อมูลทันที

โดยไม่ต้อง Refresh

---

# Multi-patient Sessions

ระบบรองรับผู้ป่วยหลายคนพร้อมกัน

แต่ละผู้ป่วยจะมี

Session ID

เป็นของตัวเอง

Socket.IO ใช้

Room

เพื่อแยกข้อมูล

ทำให้

Patient A

จะไม่เห็นข้อมูลของ

Patient B

และ Staff สามารถเลือกดูแต่ละ Session ได้

---

# Structured Thai Address

ระบบที่อยู่ประเทศไทยถูกออกแบบใหม่จาก Address แบบข้อความ

เป็นข้อมูลแบบโครงสร้าง

ประกอบด้วย

- บ้านเลขที่ / ถนน
- จังหวัด
- อำเภอ
- ตำบล
- รหัสไปรษณีย์

ข้อดี

- ลดข้อมูลผิดพลาด
- ค้นหาง่าย
- นำไปใช้งานต่อได้ง่าย
- เพิ่มคุณภาพข้อมูล

ข้อมูลจังหวัดประเทศไทยเก็บไว้ภายในโปรเจกต์

ไม่ต้องเรียก API ภายนอก

---

# Responsive Design

รองรับ

Desktop

Tablet

Mobile

หน้าจอจะปรับ

- Layout
- Grid
- Form
- Staff Dashboard

ตามขนาดหน้าจอ

---

# Accessibility

รองรับ

- Keyboard Navigation
- ARIA
- Accessible Combobox
- Error Association
- Focus Management

---

# Validation

ระบบตรวจสอบ

- Required Fields
- Email
- Phone Number
- Date of Birth
- Gender
- Preferred Language
- Structured Address
- Postal Code

ทั้งฝั่ง

- Client
- Server

เพื่อป้องกันข้อมูลผิดพลาด

---

# การติดตั้ง

## ติดตั้ง Package

```bash
npm install
```

---

## รัน Socket Server

```bash
npm run server:dev
```

---

## รัน Frontend

```bash
npm run dev
```

---

เปิดใช้งาน

```
http://localhost:3000
```

หรือ

```
http://localhost:3000/patient
```

Staff

```
http://localhost:3000/staff
```

---

# Environment Variables

ตัวอย่าง

```
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

FRONTEND_ORIGIN=http://localhost:3000
```

---

# Scripts

```
npm run dev

npm run server:dev

npm run build

npm run lint

npm run typecheck

npm run test
```

---

# ผลการตรวจสอบ

ผ่าน

- TypeScript
- ESLint
- Unit Tests
- Production Build

---

# ข้อจำกัดของระบบ

โปรเจกต์นี้เป็น Candidate Assignment

ข้อมูลผู้ป่วยถูกเก็บไว้ใน Memory

จึงหายเมื่อ Restart Server

ยังไม่มี

- Authentication
- Database
- Authorization
- Audit Log
- Persistent Storage

ซึ่งสามารถต่อยอดได้ใน Production

---

# Deployment

Frontend

(Vercel URL)

Backend

(Railway URL)

Repository

(GitHub URL)

---

# ผู้พัฒนา

Tawan Kanjanakomol