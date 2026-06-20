"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const user_repository_1 = require("../repositories/user.repository");
class AuthService {
    FIXED_OTP = '123456';
    async sendOtp(mobile) {
        let user = await user_repository_1.userRepository.findByMobile(mobile);
        let isNewUser = false;
        if (!user) {
            const userCode = await user_repository_1.userRepository.generateUniqueCode();
            user = await user_repository_1.userRepository.create({
                mobile_number: mobile,
                first_name: 'کاربر',
                last_name: 'جدید',
                code: userCode
            });
            isNewUser = true;
        }
        if (!user) {
            throw new Error('خطا در ایجاد کاربر');
        }
        if (user.is_blocked) {
            throw new Error('حساب کاربری شما مسدود شده است');
        }
        console.log(`📱 OTP برای ${mobile}: ${this.FIXED_OTP} (${user.is_admin ? 'ادمین' : 'کاربر'})`);
        return {
            otp: this.FIXED_OTP,
            isNewUser,
            userInfo: {
                id: user.id,
                mobile_number: user.mobile_number,
                full_name: user.full_name,
                code: user.code,
                isAdmin: user.is_admin,
                is_blocked: user.is_blocked
            }
        };
    }
    async verifyOtp(mobile, otp) {
        if (otp !== this.FIXED_OTP) {
            return null;
        }
        const user = await user_repository_1.userRepository.findByMobile(mobile);
        if (!user) {
            return null;
        }
        if (user.is_blocked) {
            throw new Error('حساب کاربری شما مسدود شده است');
        }
        console.log(`✅ ورود ${user.is_admin ? 'ادمین' : 'کاربر'}: ${user.mobile_number}`);
        return {
            id: user.id,
            mobile_number: user.mobile_number,
            full_name: user.full_name,
            code: user.code,
            isAdmin: user.is_admin
        };
    }
    async getUserById(userId) {
        return user_repository_1.userRepository.findById(userId);
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
