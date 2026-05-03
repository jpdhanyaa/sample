console.log("🚀 server.js running");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());

// ================= DB CONNECTION =================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "dhanyaa@2006",
    database: "edoc"
});

db.connect(err => {
    if (err) {
        console.log("DB error:", err);
        return;
    }
    console.log("Connected to DB");
});

// ================= LOGIN =================
app.post("/login", (req, res) => {
    const { email, password, role } = req.body;

    const roleLower = (role || "").toLowerCase();

    let table = "";
    if (roleLower === "patient") table = "patients";
    else if (roleLower === "doctor") table = "doctors";
    else if (roleLower === "admin") table = "admins";

    if (!table) {
        return res.json({ status: "error", message: "Invalid role" });
    }

    const sql = `SELECT * FROM ${table} WHERE email=?`;

    db.query(sql, [email], (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ status: "error" });
        }

        if (!result || result.length === 0) {
            return res.json({ status: "fail" });
        }

        if (result[0].password !== password) {
            return res.json({ status: "fail" });
        }

        console.log("LOGIN:", email, roleLower);
        res.json({
            status: "success",
            user: result[0]
        });
    });
});

// ================= FORGOT PASSWORD =================
app.post("/forgot-password", (req, res) => {
    const { email } = req.body;

    const tables = ["patients", "doctors", "admins"];

    const checkNext = (i) => {
        if (i >= tables.length) {
            return res.json({ status: "fail" });
        }

        const sql = `SELECT * FROM ${tables[i]} WHERE email=?`;

        db.query(sql, [email], (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ status: "error" });
            }

            if (result && result.length > 0) {
                return res.json({ status: "success" });
            } else {
                checkNext(i + 1);
            }
        });
    };

    checkNext(0);
});

// ================= RESET PASSWORD =================
app.post("/reset-password", (req, res) => {
    const { email, newPassword } = req.body;

    const tables = ["patients", "doctors", "admins"];

    const updateNext = (i) => {
        if (i >= tables.length) {
            return res.json({ status: "fail" });
        }

        const checkSql = `SELECT * FROM ${tables[i]} WHERE email=?`;

        db.query(checkSql, [email], (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ status: "error" });
            }

            if (result && result.length > 0) {

                const updateSql = `UPDATE ${tables[i]} SET password=? WHERE email=?`;

                db.query(updateSql, [newPassword, email], (err2) => {
                    if (err2) {
                        console.log(err2);
                        return res.json({ status: "error" });
                    }
                    return res.json({ status: "success" });
                });

            } else {
                updateNext(i + 1);
            }
        });
    };

    updateNext(0);
});

// ================= SIGNUP =================
app.post("/signup", (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    const roleLower = (role || "").toLowerCase();

    let table = "";
    if (roleLower === "patient") table = "patients";
    else if (roleLower === "doctor") table = "doctors";

    if (!table) {
        return res.json({ status: "error", message: "Invalid role" });
    }

    const checkSql = `SELECT * FROM ${table} WHERE email=?`;

    db.query(checkSql, [email], (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ status: "error" });
        }

        if (result && result.length > 0) {
            return res.json({ status: "exists" });
        }

        const insertSql = `
            INSERT INTO ${table} (first_name, last_name, email, password)
            VALUES (?, ?, ?, ?)
        `;

        db.query(insertSql, [firstName, lastName, email, password], (err2, result2) => {
            if (err2) {
                console.log(err2);
                return res.json({ status: "error" });
            }

            res.json({
                status: "success",
                user: {
                    id: result2.insertId,
                    first_name: firstName,
                    last_name: lastName,
                    email: email
                }
            });
        });
    });
});

// ================= BOOK APPOINTMENT =================
app.post("/book-appointment", (req, res) => {
    const { patientName, patientEmail, doctorName, date, timeSlot, session } = req.body;

    console.log("BOOK APPOINTMENT:", req.body);

    if (!patientEmail || !doctorName || !date || !timeSlot) {
        return res.status(400).json({ status: "error", message: "Missing required fields" });
    }

    // Find the doctor's ID from their name
    const doctorQuery = `SELECT id FROM doctors WHERE CONCAT(first_name, ' ', last_name) = ? LIMIT 1`;

    db.query(doctorQuery, [doctorName], (err, doctorResult) => {
        if (err) {
            console.log("DOCTOR LOOKUP ERROR:", err);
            return res.status(500).json({ status: "error", message: "DB error looking up doctor" });
        }

        const doctorId = doctorResult && doctorResult.length > 0 ? doctorResult[0].id : null;

        // Find the patient's ID from their email
        const patientQuery = `SELECT id FROM patients WHERE email = ? LIMIT 1`;

        db.query(patientQuery, [patientEmail], (err2, patientResult) => {
            if (err2) {
                console.log("PATIENT LOOKUP ERROR:", err2);
                return res.status(500).json({ status: "error", message: "DB error looking up patient" });
            }

            const patientId = patientResult && patientResult.length > 0 ? patientResult[0].id : null;

            const insertSql = `
                INSERT INTO appointments
                    (patient_id, doctor_id, patient_email, doctor_name, date, time, time_slot, session, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Booked')
            `;

            const timeValue = timeSlot; // store the time slot as time too

            db.query(insertSql, [patientId, doctorId, patientEmail, doctorName, date, timeValue, timeSlot, session || "FN"], (err3, result3) => {
                if (err3) {
                    console.log("BOOK APPOINTMENT ERROR:", err3);

                    // Fallback: try without session column if it doesn't exist
                    const fallbackSql = `
                        INSERT INTO appointments
                            (patient_id, doctor_id, patient_email, doctor_name, date, time, time_slot, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'Booked')
                    `;
                    db.query(fallbackSql, [patientId, doctorId, patientEmail, doctorName, date, timeValue, timeSlot], (err4, result4) => {
                        if (err4) {
                            console.log("FALLBACK BOOK ERROR:", err4);
                            return res.status(500).json({ status: "error", message: err4.sqlMessage || "Booking failed" });
                        }
                        console.log("APPOINTMENT BOOKED (fallback):", result4.insertId);
                        return res.json({ status: "success", appointmentId: result4.insertId });
                    });
                    return;
                }

                console.log("APPOINTMENT BOOKED:", result3.insertId);
                return res.json({ status: "success", appointmentId: result3.insertId });
            });
        });
    });
});    
// ================= PATIENT DASHBOARD =================
app.get("/patient/:id", (req, res) => {

    const id = parseInt(req.params.id);

    if (!id) {
        return res.status(400).json({ error: "Invalid patient id" });
    }

    const userQuery = "SELECT id, first_name, last_name, email FROM patients WHERE id = ?";

    db.query(userQuery, [id], (err, userResult) => {
        if (err) {
            console.log("User error:", err);
            return res.status(500).json({ error: "User query error" });
        }

        const user = userResult[0] || null;
        if (!user) {
            return res.json({ user: null, appointments: [] });
        }

        // Fetch all appointments for this patient
        // Try by patient_id first, fall back to patient_email
        const appointmentQuery = `
            SELECT
                a.id,
                a.date,
                a.time,
                a.time_slot,
                a.status,
                a.doctor_name,
                COALESCE(a.doctor_name, CONCAT(d.first_name, ' ', d.last_name)) AS doctor
            FROM appointments a
            LEFT JOIN doctors d ON a.doctor_id = d.id
            WHERE a.patient_id = ? OR a.patient_email = ?
            ORDER BY a.date DESC, a.time DESC
        `;

        db.query(appointmentQuery, [id, user.email], (err2, appointmentResult) => {
            if (err2) {
                console.log("Appointment error:", err2);
                return res.status(500).json({
                    error: err2.sqlMessage || "Appointment query error",
                    code: err2.code
                });
            }

            res.json({
                user: user,
                appointments: appointmentResult || []
            });
        });
    });
});

app.get("/doctor/:id", (req, res) => {

    const id = req.params.id;

    console.log("ID RECEIVED:", id);

    db.query("SELECT * FROM doctors", (err, all) => {
        console.log("ALL DOCTORS:", all);
    });

    const doctorQuery = "SELECT * FROM doctors WHERE id = ?";

    db.query(doctorQuery, [id], (err, doctorResult) => {

        if (err) return res.json({ error: err });

        const appointmentQuery = `
            SELECT 
                a.id,
                a.date,
                a.time,
                a.status,
                p.first_name AS patient_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            WHERE a.doctor_id = ?
            ORDER BY a.date ASC
        `;

        db.query(appointmentQuery, [id], (err2, appointmentResult) => {

            if (err2) {
                console.log(err2);
                return res.json({ error: "Query error" });
            }

            res.json({
                doctor: doctorResult[0],
                appointments: appointmentResult
            });
        });

    });
});

app.post("/update-status", (req, res) => {

    const { id, status } = req.body;

    const sql = "UPDATE appointments SET status=? WHERE id=?";

    db.query(sql, [status, id], (err) => {

        if (err) {
            console.log(err);
            return res.json({ status: "error" });
        }

        res.json({ status: "success" });
    });
});

// ================= SERVER =================
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
