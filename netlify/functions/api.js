import { getStore } from '@netlify/blobs';

const BLOB_KEY = 'mainData';

async function readData(store) {
    try {
        const raw = await store.get(BLOB_KEY);
        if (!raw) return null;
        return typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(raw.toString());
    } catch {
        return null;
    }
}

async function writeData(store, data) {
    try {
        await store.set(BLOB_KEY, JSON.stringify(data));
        return true;
    } catch {
        return false;
    }
}

export default async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { action, payload } = body;

        if (!action) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: 'Action required' })
            };
        }

        const store = getStore('storfaris');
        let data = await readData(store);
        if (!data) {
            data = {
                users: [],
                deposits: [],
                messages: [],
                settings: {
                    depositStatus: 'OPEN',
                    depositName: '',
                    depositPrice: 0,
                    depositInfo: '',
                    withdrawStatus: 'OPEN'
                },
                activities: []
            };
        }

        if (!data.users) data.users = [];
        if (!data.deposits) data.deposits = [];
        if (!data.messages) data.messages = [];
        if (!data.settings) data.settings = {};
        if (!data.activities) data.activities = [];

        let response = { success: false };

        switch (action) {
            case 'get': {
                response = { success: true, data };
                break;
            }
            case 'save': {
                if (payload?.data) {
                    const newData = payload.data;
                    data.users = newData.users || data.users;
                    data.deposits = newData.deposits || data.deposits;
                    data.messages = newData.messages || data.messages;
                    data.settings = { ...data.settings, ...newData.settings };
                    data.activities = newData.activities || data.activities;
                    await writeData(store, data);
                    response = { success: true };
                } else {
                    response = { success: false, error: 'Data tidak valid' };
                }
                break;
            }
            case 'getUser': {
                const { userId, username, password } = payload;
                let user = null;
                if (userId) {
                    user = data.users.find(u => u.id === userId);
                } else if (username && password) {
                    user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
                }
                if (user) {
                    const { password: _, ...safeUser } = user;
                    response = { success: true, data: safeUser };
                } else {
                    response = { success: false, error: 'User tidak ditemukan' };
                }
                break;
            }
            case 'getBalance': {
                const { userId } = payload;
                const user = data.users.find(u => u.id === userId);
                if (user) {
                    response = { success: true, data: user.balance || 0 };
                } else {
                    response = { success: false, error: 'User tidak ditemukan' };
                }
                break;
            }
            case 'getTransactions': {
                const { userId } = payload;
                const user = data.users.find(u => u.id === userId);
                if (user) {
                    const userDeposits = data.deposits.filter(d => d.userId === userId || d.username === user.username);
                    response = { success: true, data: userDeposits };
                } else {
                    response = { success: false, error: 'User tidak ditemukan' };
                }
                break;
            }
            case 'getSettings': {
                response = { success: true, data: data.settings };
                break;
            }
            case 'save_settings': {
                const { settings } = payload;
                if (settings) {
                    data.settings = { ...data.settings, ...settings };
                    await writeData(store, data);
                    response = { success: true };
                } else {
                    response = { success: false, error: 'Settings tidak valid' };
                }
                break;
            }
            case 'save_users': {
                const { users } = payload;
                if (Array.isArray(users)) {
                    data.users = users;
                    await writeData(store, data);
                    response = { success: true };
                } else {
                    response = { success: false, error: 'Data users tidak valid' };
                }
                break;
            }
            case 'save_history': {
                const { history } = payload;
                if (Array.isArray(history)) {
                    data.deposits = history;
                    await writeData(store, data);
                    response = { success: true };
                } else {
                    response = { success: false, error: 'Data history tidak valid' };
                }
                break;
            }
            case 'registerUser': {
                const { username, email, password, fullname, userId } = payload;
                if (data.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
                    response = { success: false, error: 'Username sudah terdaftar' };
                    break;
                }
                if (data.users.some(u => u.emailPhone && u.emailPhone.toLowerCase() === email.toLowerCase())) {
                    response = { success: false, error: 'Email / Nomor HP sudah terdaftar' };
                    break;
                }
                const newUser = {
                    id: userId,
                    username,
                    emailPhone: email,
                    password,
                    fullname: fullname || username,
                    avatar: null,
                    createdAt: new Date().toISOString(),
                    balance: 0,
                    totalDeposits: 0,
                    status: 'aktif',
                    saldoHistory: [],
                    inbox: [],
                    withdrawals: []
                };
                data.users.push(newUser);
                await writeData(store, data);
                response = { success: true, data: newUser };
                break;
            }
            case 'login_user':
            case 'sync_session':
            case 'clear_session':
            case 'telegram_notify': {
                response = { success: true };
                break;
            }
            case 'reset_password': {
                const { emailPhone } = payload;
                const user = data.users.find(u => u.emailPhone && u.emailPhone.toLowerCase() === emailPhone.toLowerCase());
                if (!user) {
                    response = { success: false, error: 'Email / Nomor HP tidak ditemukan' };
                    break;
                }
                user.password = 'hash_123456';
                await writeData(store, data);
                response = { success: true };
                break;
            }
            case 'update_profile': {
                const { user } = payload;
                if (!user || !user.id) {
                    response = { success: false, error: 'Data user tidak valid' };
                    break;
                }
                const idx = data.users.findIndex(u => u.id === user.id);
                if (idx === -1) {
                    response = { success: false, error: 'User tidak ditemukan' };
                    break;
                }
                const existing = data.users[idx];
                existing.fullname = user.fullname || existing.fullname;
                existing.avatar = user.avatar || existing.avatar;
                existing.emailPhone = user.emailPhone || existing.emailPhone;
                await writeData(store, data);
                response = { success: true };
                break;
            }
            case 'saldo_update': {
                const { userId, saldo, history } = payload;
                const user = data.users.find(u => u.id === userId);
                if (!user) {
                    response = { success: false, error: 'User tidak ditemukan' };
                    break;
                }
                user.balance = saldo;
                user.saldoHistory = history || user.saldoHistory;
                await writeData(store, data);
                response = { success: true };
                break;
            }
            case 'init_sync': {
                const { users, history, settings } = payload;
                if (users) data.users = users;
                if (history) data.deposits = history;
                if (settings) data.settings = { ...data.settings, ...settings };
                await writeData(store, data);
                response = { success: true };
                break;
            }
            default: {
                response = { success: false, error: `Action '${action}' tidak dikenal` };
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify(response)
        };
    } catch (err) {
        console.error('Error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: err.message })
        };
    }
}
