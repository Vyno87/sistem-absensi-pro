const nodemailer = require('nodemailer');

// SMTP Configuration (uses environment variables)
const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Email templates
const emailTemplates = {
    dailyReport: (data) => ({
        subject: `📊 Laporan Harian Absensi - ${new Date().toLocaleDateString('id-ID')}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">Sistem Absensi PRO</h1>
                    <p style="color: #e0e0e0; margin: 10px 0 0 0;">Laporan Harian Kehadiran</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333; margin-top: 0;">Ringkasan ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                    
                    <table style="width: 100%; border-collapse: collapse; margin:  20px 0;">
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 15px; border-bottom: 2px solid #eee;"><strong>Total Hadir</strong></td>
                            <td style="padding: 15px; border-bottom: 2px solid #eee; text-align: right; color: #4ade80; font-size: 24px; font-weight: bold;">${data.present || 0}</td>
                        </tr>
                        <tr>
                            <td style="padding: 15px; border-bottom: 2px solid #eee;"><strong>Terlambat</strong></td>
                            <td style="padding: 15px; border-bottom: 2px solid #eee; text-align: right; color: #facc15; font-size: 24px; font-weight: bold;">${data.late || 0}</td>
                        </tr>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 15px; border-bottom: 2px solid #eee;"><strong>Tidak Hadir</strong></td>
                            <td style="padding: 15px; border-bottom: 2px solid #eee; text-align: right; color: #f87171; font-size: 24px; font-weight: bold;">${data.absent || 0}</td>
                        </tr>
                        <tr>
                            <td style="padding: 15px;"><strong>Total Karyawan</strong></td>
                            <td style="padding: 15px; text-align: right; font-size: 24px; font-weight: bold;">${data.total || 0}</td>
                        </tr>
                    </table>

                    ${data.lateAlerts && data.lateAlerts.length > 0 ? `
                        <div style="background: #fef3c7; border-left: 4px solid #facc15; padding: 15px; margin: 20px 0; border-radius: 5px;">
                            <h3 style="color: #92400e; margin-top: 0;">⚠️ Late Alerts Hari Ini</h3>
                            ${data.lateAlerts.map(alert => `
                                <p style="color: #78350f; margin: 5px 0;">• ${alert.employeeName} (${alert.position}) - Expected: ${alert.expectedTime}</p>
                            `).join('')}
                        </div>
                    ` : ''}

                    <p style="color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px;">
                        Laporan ini digenerate otomatis oleh Sistem Absensi PRO<br>
                        © 2026 Sistem Absensi PRO. All rights reserved.
                    </p>
                </div>
            </div>
        `
    }),

    weeklyReport: (data) => ({
        subject: `📈 Laporan Mingguan Absensi - Week ${new Date().toLocaleDateString('id-ID')}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">Sistem Absensi PRO</h1>
                    <p style="color: #e0e0e0; margin: 10px 0 0 0;">Laporan Mingguan</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333; margin-top: 0;">Summary 7 Hari Terakhir</h2>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background: #667eea; color: white;">
                            <th style="padding: 12px; text-align: left;">Metrik</th>
                            <th style="padding: 12px; text-align: right;">Jumlah</th>
                        </tr>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 12px;">Total Kehadiran</td>
                            <td style="padding: 12px; text-align: right; font-weight: bold;">${data.totalAttendance || 0}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px;">Rata-rata Hadir/Hari</td>
                            <td style="padding: 12px; text-align: right; font-weight: bold;">${data.avgDaily || 0}</td>
                        </tr>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 12px;">Tingkat Keterlambatan</td>
                            <td style="padding: 12px; text-align: right; font-weight: bold; color: #facc15;">${data.lateRate || 0}%</td>
                        </tr>
                    </table>

                    ${data.insights && data.insights.length > 0 ? `
                        <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
                            <h3 style="color: #1e40af; margin-top: 0;">💡 Insights & Recommendations</h3>
                            ${data.insights.slice(0, 3).map(insight => `
                                <p style="color: #1e3a8a; margin: 8px 0; font-size: 14px;">• ${insight.title}</p>
                            `).join('')}
                        </div>
                    ` : ''}

                    <p style="color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px;">
                        © 2026 Sistem Absensi PRO
                    </p>
                </div>
            </div>
        `
    })
};

// Send email function
const sendEmail = async (to, template, data) => {
    try {
        // Skip if SMTP not configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('⚠️ SMTP not configured. Email skipped.');
            return { success: false, error: 'SMTP not configured' };
        }

        const emailContent = emailTemplates[template](data);

        const info = await transporter.sendMail({
            from: `"Sistem Absensi PRO" <${process.env.SMTP_USER}>`,
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        });

        console.log(`✅ Email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email send error:', error);
        return { success: false, error: error.message };
    }
};

// Verify SMTP configuration
const verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ SMTP connection verified');
        return true;
    } catch (error) {
        console.error('❌ SMTP verification failed:', error.message);
        return false;
    }
};

module.exports = {
    sendEmail,
    verifyConnection,
    emailTemplates
};
