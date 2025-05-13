const express = require("express");

const server = express();


server.get("", (request, response) => {
	response.end("Hello Word");
});

const PORT = 3000;
server.listen(PORT, () => console.log("Started listening on port " + PORT));
