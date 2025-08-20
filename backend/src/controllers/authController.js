const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
        const accessToken = jwt.sign(
            { userId: newUser._id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        //RefreshToken Creation
        const refreshToken = jwt.sign(
            { userId: newUser._id, username: newUser.username },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
        );

        //Save RefreshToken in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
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
        const accessToken = jwt.sign(
            { userId: existingUser._id, username: existingUser.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        //RefreshToken Creation
        const refreshToken = jwt.sign(
            { userId: existingUser._id, username: existingUser.username },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
        );

        //Save RefreshToken in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
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

        if (!refreshToken) return res.json({ message: "No refresh token" });

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
            if (err) return res.status(403).json({ message: "Invalid refresh token" });

            const accessToken = jwt.sign(
                { userId: user.userId, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: "10m" }
            );

            res.json({ accessToken });
        });

    } catch (err) {
        console.error("Refresh error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

const logout = async (req, res) => {

    try {
        const authHeader = req.headers.authorization;
        const jwtAccessToken = authHeader && authHeader.split(" ")[1];

        if (!jwtAccessToken) {
            return res.status(401).json({ error: "No token provided" });
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(jwtAccessToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        const user = await User.findById(decodedToken.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.invalidAccessTokens.push(jwtAccessToken);
        await user.save();

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "Lax"
        });

        res.json({ message: "Logged out successfully" });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ error: "Logout failed" });
    }
};

module.exports = { signup, login, currentUser, refresh, logout };