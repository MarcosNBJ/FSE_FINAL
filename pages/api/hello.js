// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const fs = require("fs");

export default (req, res) => {
  const data = req.query;
  const timestamp = new Date().toISOString();
  const logInfo = `${timestamp},${data.device},${data.action}\n`;

  fs.writeFile("log.csv", logInfo, { flag: "a" }, function (err) {
    if (err) return console.log(err);
  });

  res.send(`Adicionado ao log: ${JSON.stringify(data)}`);
};
