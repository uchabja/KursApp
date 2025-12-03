const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
const path = require('path');
app.use(express.static(path.join(__dirname, '../dist')));

// --- Helper for Bulk Operations (to match current frontend logic) ---

// GET All Data
app.get('/api/data', async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            include: { enrollments: true }
        });
        const courses = await prisma.course.findMany();
        const payments = await prisma.payment.findMany();

        res.json({ students, courses, payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// --- Students ---

app.post('/api/students', async (req, res) => {
    try {
        const { enrollments, ...studentData } = req.body;

        // Convert dob to Date object if it exists
        if (studentData.dob) {
            studentData.dob = new Date(studentData.dob);
        }

        const student = await prisma.student.create({
            data: {
                ...studentData,
                enrollments: {
                    create: enrollments
                }
            },
            include: { enrollments: true }
        });
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { enrollments, ...studentData } = req.body;

        // Convert dob to Date object if it exists
        if (studentData.dob) {
            studentData.dob = new Date(studentData.dob);
        }

        // Update student details
        const student = await prisma.student.update({
            where: { id },
            data: studentData,
            include: { enrollments: true }
        });
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.student.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Courses ---

app.post('/api/courses', async (req, res) => {
    try {
        const courseData = req.body;
        if (courseData.startDate) {
            courseData.startDate = new Date(courseData.startDate);
        }
        const course = await prisma.course.create({ data: courseData });
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const courseData = req.body;
        if (courseData.startDate) {
            courseData.startDate = new Date(courseData.startDate);
        }
        const course = await prisma.course.update({
            where: { id },
            data: courseData
        });
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.course.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Enrollments & Payments ---

// Enroll Student (Update Student Enrollments + Create Payments)
app.post('/api/enroll', async (req, res) => {
    try {
        const { studentId, courseId, joinDate, payments } = req.body;

        // Transaction to ensure consistency
        const result = await prisma.$transaction(async (prisma) => {
            // 1. Add Enrollment
            await prisma.enrollment.create({
                data: { studentId, courseId, joinDate: new Date(joinDate) }
            });

            // 2. Create Payments
            if (payments && payments.length > 0) {
                await prisma.payment.createMany({
                    data: payments.map(p => ({
                        ...p,
                        periodStart: new Date(p.periodStart),
                        periodEnd: new Date(p.periodEnd),
                        dueDate: new Date(p.dueDate),
                        paidDate: p.paidDate ? new Date(p.paidDate) : null
                    }))
                });
            }

            return { success: true };
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Unenroll Student
app.post('/api/unenroll', async (req, res) => {
    try {
        const { studentId, courseId } = req.body;

        await prisma.$transaction(async (prisma) => {
            // 1. Remove Enrollment
            await prisma.enrollment.deleteMany({
                where: { studentId, courseId }
            });

            // 2. Remove Pending Payments
            await prisma.payment.deleteMany({
                where: {
                    studentId,
                    courseId,
                    status: 'pending'
                }
            });
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Payment Status
app.put('/api/payments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paidDate } = req.body;

        const payment = await prisma.payment.update({
            where: { id },
            data: {
                status,
                paidDate: paidDate ? new Date(paidDate) : null
            }
        });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Transfer Student
app.post('/api/transfer', async (req, res) => {
    try {
        const { studentId, oldCourseId, newCourseId, transferDate, newPayments } = req.body;

        await prisma.$transaction(async (prisma) => {
            // 1. Remove pending payments for OLD course
            await prisma.payment.deleteMany({
                where: { studentId, courseId: oldCourseId, status: 'pending' }
            });

            // 2. Remove OLD enrollment
            await prisma.enrollment.deleteMany({
                where: { studentId, courseId: oldCourseId }
            });

            // 3. Add NEW enrollment
            await prisma.enrollment.create({
                data: { studentId, courseId: newCourseId, joinDate: new Date(transferDate) }
            });

            // 4. Create NEW payments
            if (newPayments && newPayments.length > 0) {
                await prisma.payment.createMany({
                    data: newPayments.map(p => ({
                        ...p,
                        periodStart: new Date(p.periodStart),
                        periodEnd: new Date(p.periodEnd),
                        dueDate: new Date(p.dueDate),
                        paidDate: p.paidDate ? new Date(p.paidDate) : null
                    }))
                });
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
