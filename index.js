const Fastify = require("fastify");
const FastifyCors = require("@fastify/cors");
const FastifyHelmet = require("@fastify/helmet");
const FastifyMultipart = require("@fastify/multipart");
const qs = require("qs");
const axios = require("axios");
const { pdf } = require("pdf-to-img");

const fastify = Fastify({
  logger: true,
  requestTimeout: 30000,
  querystringParser: (str) => qs.parse(str),
});

fastify
  .register(FastifyCors, { origin: "*", methods: "GET" })
  .register(FastifyHelmet, { global: true })
  .register(FastifyMultipart);

fastify.get("/", (_, reply) => reply.send("Welcome to pdf2img API!"));
fastify.get("*", (_, reply) => reply.send("Page not found!"));

fastify.get("/keep-alive", async (_, reply) => {
  if (!process.env.VERCEL_URL) return;
  await axios.get(`https://${process.env.VERCEL_URL}/health`);
  reply.send("ok");
});

fastify.get("/health", (_, reply) => reply.send("ok"));

fastify.post("/convert", async (req, reply) => {
  const data = await req.file();
  const buffer = await data.toBuffer()
  
  const document = await pdf(buffer);

  const images = [];
  for await (const image of document) {
    images.push({
      inlineData: {
        data: image.toString("base64"),
        mimeType: "image/png",
      },
    });
  }

  reply.send(images);
});

fastify.listen(
  { host: "0.0.0.0", port: Number(process.env.PORT) || 8080 },
  (err, address) => {
    if (err) throw err;
    console.log(`Listening to ${address}`);
  }
);
