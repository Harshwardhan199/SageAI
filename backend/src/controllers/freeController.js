const axios = require("axios")

const chat = async (req, res) => {
    try {

        let { promptText } = req.body;

        // send promptText to api
        const apiRes = await axios.post("http://127.0.0.1:8000/chat", { "model": "llama3:latest", "message": promptText });

        let rawResponse = apiRes.data;
        let cleanResponse = rawResponse;
        if (typeof rawResponse === "string") {
            try {
                cleanResponse = JSON.parse(rawResponse);
            } catch {
                cleanResponse = rawResponse;
            }
        }

        //const response = JSON.stringify(apiRes.data, null, 2)

        return res.json({ message: "Response to prompt", rawResponse });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { chat };