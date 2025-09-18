const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const User = require("../models/User");

const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password,
            //password: hashedPassword,
        });

        await newUser.save();

        //AccessToken Creation
        const accessToken = jwt.sign({ userId: newUser._id, username: newUser.username, email: newUser.email, tokenVersion: 0 }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        //RefreshToken Creation
        const refreshToken = jwt.sign({ userId: newUser._id, tokenVersion: 0 }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

        //Save RefreshToken in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        //Swnd AccessToken with response
        res.status(201).json({
            message: "Signup successful",
            data: { username: newUser.username, email: newUser.email },
            accessToken
        });

    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ error: "User not found" });
        }

        if (password != existingUser.password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        // if (!isPasswordValid) {
        //     return res.status(401).json({ error: "Invalid credentials" });
        // }

        //AccessToken Creation
        const accessToken = jwt.sign({ userId: existingUser._id, username: existingUser.username, email: existingUser.email, tokenVersion: existingUser.tokenVersion }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        //RefreshToken Creation
        const refreshToken = jwt.sign({ userId: existingUser._id, tokenVersion: existingUser.tokenVersion }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

        //Save RefreshToken in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        //Save AccessToken with response
        res.status(201).json({
            message: "Signup successful",
            data: { username: existingUser.username, email: existingUser.email },
            accessToken
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

const googleSignIn = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) return res.status(400).json({ message: "Authorization code required" });

        let data;
        try {
            const response = await axios.post(
                "https://oauth2.googleapis.com/token",
                new URLSearchParams({
                    code,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: "postmessage",
                    grant_type: "authorization_code",
                }),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );
            data = response.data;


        } catch (err) {
            console.error("Google token exchange error:", err.response?.data || err.message);
        }

        const { access_token } = data;

        const userInfo = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, { headers: { Authorization: `Bearer ${access_token}` } });

        const { sub: googleId, email, name } = userInfo.data;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                username: name,
                email,
                authProvider: "google",
                googleId,
                tokenVersion: 0,
            });
        }
        else {
            user.tokenVersion += 1;
            await user.save();
        }

        //AccessToken Creation
        const accessToken = jwt.sign({ userId: user._id, username: user.username, email: user.email, tokenVersion: user.tokenVersion }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        //RefreshToken Creation
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

        //Save RefreshToken in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        //Save AccessToken with response
        res.status(201).json({
            message: "Signup successful",
            data: { username: user.username, email: user.email },
            accessToken
        });

    } catch (err) {
        console.error("Google login error:", err);
        res.status(500).json({ message: "Google login failed" });
    }
};

const currentUser = async (req, res) => {
    const refToken = req.cookies.refreshToken;

    if (!refToken) {
        return res.status(204).send();
    }

    return res.status(200).send();

};

const refresh = async (req, res) => {    
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: "Invalid refresh token" });

            const userFromDB = await User.findById(decoded.userId);
            if (!userFromDB) return res.status(404).json({ message: "User not found" });

            userFromDB.tokenVersion += 1;
            await userFromDB.save();

            const accessToken = jwt.sign({ userId: userFromDB._id, username: userFromDB.username, email: userFromDB.email, tokenVersion: userFromDB.tokenVersion }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
            const refreshToken = jwt.sign({ userId: userFromDB._id, tokenVersion: userFromDB.tokenVersion }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "None",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            //Swnd AccessToken with response
            res.status(200).json({
                message: "Refresh successful",
                user: { username: userFromDB.username, email: userFromDB.email },
                accessToken
            });

        });

    } catch (err) {
        console.error("Refresh error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: "No refresh token provided" });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.tokenVersion += 1;
        await user.save();

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        });

        res.json({ message: "Logged out successfully" });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ error: "Logout failed" });
    }
};

module.exports = { signup, login, googleSignIn, currentUser, refresh, logout };